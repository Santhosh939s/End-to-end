import api from './api';

// Cache the public key
let cachedServerPublicKey: CryptoKey | null = null;

const fetchAndImportPublicKey = async (): Promise<CryptoKey> => {
  if (cachedServerPublicKey) return cachedServerPublicKey;

  const res = await api.get('/auth/server-key');
  const pem = res.data.publicKey;

  // Clean PEM string
  const pemContents = pem
    .replace('-----BEGIN PUBLIC KEY-----', '')
    .replace('-----END PUBLIC KEY-----', '')
    .replace(/\s/g, '');
  
  const binaryDerString = window.atob(pemContents);
  const binaryDer = new ArrayBuffer(binaryDerString.length);
  const bufView = new Uint8Array(binaryDer);
  for (let i = 0; i < binaryDerString.length; i++) {
    bufView[i] = binaryDerString.charCodeAt(i);
  }

  cachedServerPublicKey = await window.crypto.subtle.importKey(
    'spki',
    binaryDer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    ['encrypt']
  );

  return cachedServerPublicKey;
};

export const encryptBiometricPayload = async (descriptor: Float32Array): Promise<string> => {
  const publicKey = await fetchAndImportPublicKey();
  
  // Convert Float32Array to string representation
  const descriptorArray = Array.from(descriptor);
  const payloadString = JSON.stringify(descriptorArray);
  const enc = new TextEncoder();
  const encodedData = enc.encode(payloadString);

  // Note: RSA-OAEP with 2048-bit key can only encrypt ~190 bytes. 
  // A stringified 128-float array is larger than 190 bytes (around 2-3KB).
  // Thus, we must use hybrid encryption for the payload:
  // 1. Generate random AES-GCM key
  // 2. Encrypt payload with AES-GCM
  // 3. Encrypt AES key with Server RSA Public Key
  // Actually, wait, node's privateDecrypt handles this if we do it properly, 
  // but if the payload is too large, RSA will throw an error!
  
  // Let's implement Hybrid Encryption for the transit payload to be safe.
  const aesKey = await window.crypto.subtle.generateKey(
    { name: 'AES-CBC', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  
  const iv = window.crypto.getRandomValues(new Uint8Array(16));
  const encryptedPayloadBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-CBC', iv },
    aesKey,
    encodedData
  );

  const exportedAesKey = await window.crypto.subtle.exportKey('raw', aesKey);
  const encryptedAesKeyBuffer = await window.crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    publicKey,
    exportedAesKey
  );

  // Return a combined payload that the backend can parse.
  // Format: base64(RSA(AESKey)) + "." + base64(IV) + "." + base64(AES(Payload))
  
  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };
  
  const rsaB64 = arrayBufferToBase64(encryptedAesKeyBuffer);
  const ivB64 = arrayBufferToBase64(iv.buffer);
  const payloadB64 = arrayBufferToBase64(encryptedPayloadBuffer);

  return `${rsaB64}.${ivB64}.${payloadB64}`;
};

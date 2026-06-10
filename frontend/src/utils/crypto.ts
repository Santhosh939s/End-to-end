// Web Crypto API utility functions for E2EE

/**
 * ArrayBuffer to Base64 String
 */
export const bufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

/**
 * Base64 String to ArrayBuffer
 */
export const base64ToBuffer = (base64: string): ArrayBuffer => {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
};

/**
 * Generates an RSA-OAEP Key Pair for the user (Used for encrypting the AES keys)
 */
export const generateKeyPair = async () => {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt']
  );

  const exportedPublicKey = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
  const exportedPrivateKey = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  return {
    publicKey: bufferToBase64(exportedPublicKey),
    privateKey: bufferToBase64(exportedPrivateKey),
    rawKeyPair: keyPair,
  };
};

/**
 * Derives an AES-GCM master key from the user's password using PBKDF2
 */
export const deriveMasterKey = async (password: string, saltBase64: string) => {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const salt = base64ToBuffer(saltBase64);

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
};

/**
 * Encrypts the user's private key with their master password key
 */
export const encryptPrivateKey = async (privateKeyBase64: string, masterKey: CryptoKey) => {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const data = enc.encode(privateKeyBase64);

  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    masterKey,
    data
  );

  return {
    encryptedPrivateKey: bufferToBase64(encrypted),
    iv: bufferToBase64(iv),
  };
};

/**
 * Decrypts the user's private key using their master password key
 */
export const decryptPrivateKey = async (encryptedPrivateKeyBase64: string, ivBase64: string, masterKey: CryptoKey) => {
  const data = base64ToBuffer(encryptedPrivateKeyBase64);
  const iv = base64ToBuffer(ivBase64);

  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    masterKey,
    data
  );

  const dec = new TextDecoder();
  return dec.decode(decrypted);
};

/**
 * Encrypts a message text for a recipient
 */
export const encryptMessage = async (
  text: string, 
  recipientPublicKeyBase64: string, 
  senderPublicKeyBase64: string
) => {
  const enc = new TextEncoder();
  
  // 1. Generate random AES-GCM key for this specific message
  const messageKey = await window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  // 2. Encrypt the actual message text with the AES key
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encryptedContentBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    messageKey,
    enc.encode(text)
  );

  // 3. Export the AES key so we can encrypt it
  const rawMessageKey = await window.crypto.subtle.exportKey('raw', messageKey);

  // 4. Import recipient and sender public keys
  const importRsaKey = async (base64Key: string) => {
    return window.crypto.subtle.importKey(
      'spki',
      base64ToBuffer(base64Key),
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      false,
      ['encrypt']
    );
  };

  const recipientPub = await importRsaKey(recipientPublicKeyBase64);
  const senderPub = await importRsaKey(senderPublicKeyBase64);

  // 5. Encrypt the AES key for both recipient and sender
  const encryptedKeyForReceiver = await window.crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    recipientPub,
    rawMessageKey
  );

  const encryptedKeyForSender = await window.crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    senderPub,
    rawMessageKey
  );

  return {
    encryptedContent: bufferToBase64(encryptedContentBuffer),
    iv: bufferToBase64(iv),
    encryptedKeyForReceiver: bufferToBase64(encryptedKeyForReceiver),
    encryptedKeyForSender: bufferToBase64(encryptedKeyForSender)
  };
};

/**
 * Decrypts a message using the user's RSA private key
 */
export const decryptMessage = async (
  encryptedContentBase64: string,
  ivBase64: string,
  encryptedKeyBase64: string, // either for receiver or sender
  privateKeyBase64: string
) => {
  // 1. Import Private Key
  const privateKey = await window.crypto.subtle.importKey(
    'pkcs8',
    base64ToBuffer(privateKeyBase64),
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['decrypt']
  );

  // 2. Decrypt the AES message key using RSA private key
  const rawMessageKey = await window.crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    privateKey,
    base64ToBuffer(encryptedKeyBase64)
  );

  // 3. Import the decrypted AES key
  const messageKey = await window.crypto.subtle.importKey(
    'raw',
    rawMessageKey,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  // 4. Decrypt the message content
  const decryptedContentBuffer = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(base64ToBuffer(ivBase64)) },
    messageKey,
    base64ToBuffer(encryptedContentBase64)
  );

  const dec = new TextDecoder();
  return dec.decode(decryptedContentBuffer);
};

export const generateSalt = () => {
  return bufferToBase64(window.crypto.getRandomValues(new Uint8Array(16)));
};

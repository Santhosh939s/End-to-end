import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const SERVER_SECRET = process.env.SERVER_SECRET || 'fallback_secret_key_32_chars_123';
const KEYS_FILE = path.join(__dirname, '../../server_keys.json');

// Ensure the secret is 32 bytes for AES-256
const getSecretKey = () => {
  return crypto.createHash('sha256').update(SERVER_SECRET).digest();
};

export const symmetricEncrypt = (text: string): string => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', getSecretKey(), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
};

export const symmetricDecrypt = (encryptedData: string): string => {
  const [ivHex, encryptedText] = encryptedData.split(':');
  if (!ivHex || !encryptedText) return '';
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', getSecretKey(), iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

// Application-Layer RSA Encryption for In-Transit Biometrics
export const getServerKeys = () => {
  if (fs.existsSync(KEYS_FILE)) {
    const keys = JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8'));
    return keys;
  }

  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });

  const keys = { publicKey, privateKey };
  fs.writeFileSync(KEYS_FILE, JSON.stringify(keys));
  return keys;
};

export const decryptInTransitPayload = (hybridPayload: string): string => {
  const { privateKey } = getServerKeys();
  const parts = hybridPayload.split('.');
  if (parts.length !== 3) throw new Error('Invalid hybrid payload format');

  const rsaB64 = parts[0] as string;
  const ivB64 = parts[1] as string;
  const payloadB64 = parts[2] as string;

  // 1. Decrypt the AES key using RSA
  const encryptedAesKey = Buffer.from(rsaB64, 'base64');
  const aesKey = crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256'
    },
    encryptedAesKey
  );

  // 2. Decrypt the payload using AES-CBC
  const iv = Buffer.from(ivB64, 'base64');
  const encryptedPayload = Buffer.from(payloadB64, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-cbc', aesKey, iv);
  
  let decrypted = decipher.update(encryptedPayload);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  
  return decrypted.toString('utf8');
};

export const calculateDistance = (desc1: number[], desc2: number[]): number => {
  let sum = 0;
  for (let i = 0; i < desc1.length; i++) {
    const diff = (desc1[i] ?? 0) - (desc2[i] ?? 0);
    sum += diff * diff;
  }
  return Math.sqrt(sum);
};

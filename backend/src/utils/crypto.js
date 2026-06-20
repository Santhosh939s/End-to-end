"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateDistance = exports.decryptInTransitPayload = exports.getServerKeys = exports.symmetricDecrypt = exports.symmetricEncrypt = void 0;
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const SERVER_SECRET = process.env.SERVER_SECRET || 'fallback_secret_key_32_chars_123';
const KEYS_FILE = path_1.default.join(__dirname, '../../server_keys.json');
// Ensure the secret is 32 bytes for AES-256
const getSecretKey = () => {
    return crypto_1.default.createHash('sha256').update(SERVER_SECRET).digest();
};
const symmetricEncrypt = (text) => {
    const iv = crypto_1.default.randomBytes(16);
    const cipher = crypto_1.default.createCipheriv('aes-256-cbc', getSecretKey(), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
};
exports.symmetricEncrypt = symmetricEncrypt;
const symmetricDecrypt = (encryptedData) => {
    const [ivHex, encryptedText] = encryptedData.split(':');
    if (!ivHex || !encryptedText)
        return '';
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto_1.default.createDecipheriv('aes-256-cbc', getSecretKey(), iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};
exports.symmetricDecrypt = symmetricDecrypt;
// Application-Layer RSA Encryption for In-Transit Biometrics
const getServerKeys = () => {
    if (fs_1.default.existsSync(KEYS_FILE)) {
        const keys = JSON.parse(fs_1.default.readFileSync(KEYS_FILE, 'utf8'));
        return keys;
    }
    const { publicKey, privateKey } = crypto_1.default.generateKeyPairSync('rsa', {
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
    fs_1.default.writeFileSync(KEYS_FILE, JSON.stringify(keys));
    return keys;
};
exports.getServerKeys = getServerKeys;
const decryptInTransitPayload = (hybridPayload) => {
    const { privateKey } = (0, exports.getServerKeys)();
    const parts = hybridPayload.split('.');
    if (parts.length !== 3)
        throw new Error('Invalid hybrid payload format');
    const rsaB64 = parts[0];
    const ivB64 = parts[1];
    const payloadB64 = parts[2];
    // 1. Decrypt the AES key using RSA
    const encryptedAesKey = Buffer.from(rsaB64, 'base64');
    const aesKey = crypto_1.default.privateDecrypt({
        key: privateKey,
        padding: crypto_1.default.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256'
    }, encryptedAesKey);
    // 2. Decrypt the payload using AES-CBC
    const iv = Buffer.from(ivB64, 'base64');
    const encryptedPayload = Buffer.from(payloadB64, 'base64');
    const decipher = crypto_1.default.createDecipheriv('aes-256-cbc', aesKey, iv);
    let decrypted = decipher.update(encryptedPayload);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString('utf8');
};
exports.decryptInTransitPayload = decryptInTransitPayload;
const calculateDistance = (desc1, desc2) => {
    let sum = 0;
    for (let i = 0; i < desc1.length; i++) {
        const diff = (desc1[i] ?? 0) - (desc2[i] ?? 0);
        sum += diff * diff;
    }
    return Math.sqrt(sum);
};
exports.calculateDistance = calculateDistance;
//# sourceMappingURL=crypto.js.map
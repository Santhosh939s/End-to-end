"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = require("crypto");
const user_repository_1 = require("../repositories/user.repository");
const chat_repository_1 = require("../repositories/chat.repository");
const zod_1 = require("zod");
const crypto_2 = require("../utils/crypto");
const auth_middleware_1 = require("../middleware/auth.middleware");
const otp_repository_1 = require("../repositories/otp.repository");
const email_1 = require("../utils/email");
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_cipherlink_key_for_dev';
const registerSchema = zod_1.z.object({
    username: zod_1.z.string().min(3).max(20).regex(/^[a-z0-9_.]+$/),
    email: zod_1.z.string().email(),
    fullName: zod_1.z.string().min(1),
    password: zod_1.z.string().min(6), // The raw password to be hashed for login
    publicKey: zod_1.z.string(),
    encryptedPrivateKey: zod_1.z.string(),
    keySalt: zod_1.z.string(),
    faceEnabled: zod_1.z.boolean().optional(),
    inTransitEncryptedFaceDescriptor: zod_1.z.string().optional(),
    otp: zod_1.z.string().length(6),
});
router.get('/server-key', (req, res) => {
    res.json({ publicKey: (0, crypto_2.getServerKeys)().publicKey });
});
router.post('/register', async (req, res) => {
    try {
        const data = registerSchema.parse(req.body);
        const existingUser = await user_repository_1.UserRepository.findByUsername(data.username);
        if (existingUser) {
            return res.status(400).json({ error: 'Username already taken' });
        }
        const isValidOtp = await otp_repository_1.OtpRepository.verifyOtp(data.email, data.otp);
        if (!isValidOtp) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }
        const passwordHash = await bcrypt_1.default.hash(data.password, 10);
        const id = (0, crypto_1.randomUUID)();
        let encryptedFaceDescriptor = null;
        let serverEncryptedPrivateKey = null;
        if (data.faceEnabled && data.inTransitEncryptedFaceDescriptor) {
            // 1. Decrypt the biometric payload (which was encrypted by frontend using Server Public Key)
            const rawDescriptorStr = (0, crypto_2.decryptInTransitPayload)(data.inTransitEncryptedFaceDescriptor);
            // 2. Encrypt symmetrically for database at-rest storage
            encryptedFaceDescriptor = (0, crypto_2.symmetricEncrypt)(rawDescriptorStr);
            // 3. Encrypt the private key with the Server Secret so they can log in via Face later
            if (req.body.rawPrivateKeyForEscrow) {
                serverEncryptedPrivateKey = (0, crypto_2.symmetricEncrypt)(req.body.rawPrivateKeyForEscrow);
            }
            else {
                serverEncryptedPrivateKey = (0, crypto_2.symmetricEncrypt)(data.encryptedPrivateKey);
            }
        }
        const user = await user_repository_1.UserRepository.create({
            id,
            username: data.username,
            email: data.email,
            fullName: data.fullName,
            passwordHash,
            publicKey: data.publicKey,
            encryptedPrivateKey: data.encryptedPrivateKey,
            keySalt: data.keySalt,
            faceEnabled: data.faceEnabled,
            encryptedFaceDescriptor,
            serverEncryptedPrivateKey
        });
        res.status(201).json({ message: 'User registered successfully', userId: id, isAdmin: user?.isAdmin });
    }
    catch (error) {
        console.error('Registration Error:', error);
        res.status(400).json({ error: error.message || 'Registration failed' });
    }
});
router.post('/send-otp', async (req, res) => {
    try {
        const { email, username } = req.body;
        if (!email || !username) {
            return res.status(400).json({ error: 'Email and username are required' });
        }
        // Check if username already exists
        const existingUsername = await user_repository_1.UserRepository.findByUsername(username);
        if (existingUsername) {
            return res.status(400).json({ error: 'Username already taken' });
        }
        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await otp_repository_1.OtpRepository.createOtp(email, otp);
        await (0, email_1.sendOtpEmail)(email, otp);
        res.json({ message: 'OTP sent successfully to email' });
    }
    catch (error) {
        console.error('Send OTP Error:', error);
        res.status(500).json({ error: 'Failed to send OTP. Please check your email configuration.' });
    }
});
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await user_repository_1.UserRepository.findByUsername(username);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const validPassword = await bcrypt_1.default.compare(password, user.passwordHash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, username: user.username, isAdmin: user.isAdmin }, JWT_SECRET, { expiresIn: '7d' });
        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                fullName: user.fullName,
                email: user.email,
                bio: user.bio,
                faceEnabled: !!user.faceEnabled,
                isAdmin: user.isAdmin,
            },
            crypto: {
                publicKey: user.publicKey,
                encryptedPrivateKey: user.encryptedPrivateKey,
                keySalt: user.keySalt,
            }
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});
router.post('/login-face', async (req, res) => {
    try {
        const { inTransitEncryptedFaceDescriptor } = req.body;
        if (!inTransitEncryptedFaceDescriptor) {
            return res.status(400).json({ error: 'Missing face data' });
        }
        // 1. Decrypt network payload
        const rawDescriptorStr = (0, crypto_2.decryptInTransitPayload)(inTransitEncryptedFaceDescriptor);
        const liveDescriptor = JSON.parse(rawDescriptorStr);
        // 2. 1-to-N Search against all face-enabled users
        const users = await user_repository_1.UserRepository.getAllFaceEnabledUsers();
        let bestMatch = null;
        let minDistance = 0.55; // Threshold for face matching
        for (const user of users) {
            if (!user.encryptedFaceDescriptor)
                continue;
            // Decrypt stored descriptor
            const storedStr = (0, crypto_2.symmetricDecrypt)(user.encryptedFaceDescriptor);
            const storedDescriptor = JSON.parse(storedStr);
            const distance = (0, crypto_2.calculateDistance)(liveDescriptor, storedDescriptor);
            if (distance < minDistance) {
                minDistance = distance;
                bestMatch = user;
            }
        }
        if (!bestMatch) {
            return res.status(401).json({ error: 'Face not recognized' });
        }
        // 3. User is recognized! Unlock the server escrow key
        const decryptedPrivateKey = (0, crypto_2.symmetricDecrypt)(bestMatch.serverEncryptedPrivateKey);
        const token = jsonwebtoken_1.default.sign({ id: bestMatch.id, username: bestMatch.username, isAdmin: bestMatch.isAdmin }, JWT_SECRET, { expiresIn: '7d' });
        res.json({
            token,
            user: {
                id: bestMatch.id,
                username: bestMatch.username,
                fullName: bestMatch.fullName,
                email: bestMatch.email,
                bio: bestMatch.bio,
                faceEnabled: true,
                isAdmin: bestMatch.isAdmin,
            },
            crypto: {
                publicKey: bestMatch.publicKey,
                rawPrivateKey: decryptedPrivateKey, // Backend provides the escrowed raw private key
                keySalt: bestMatch.keySalt,
            }
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Face login failed' });
    }
});
router.post('/toggle-face', auth_middleware_1.authenticateToken, async (req, res) => {
    try {
        const { faceEnabled, inTransitEncryptedFaceDescriptor, encryptedPrivateKey } = req.body;
        const userId = req.user.id;
        const user = await user_repository_1.UserRepository.findById(userId);
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        if (faceEnabled) {
            if (!inTransitEncryptedFaceDescriptor || !encryptedPrivateKey) {
                return res.status(400).json({ error: 'Missing face data or private key' });
            }
            const rawDescriptorStr = (0, crypto_2.decryptInTransitPayload)(inTransitEncryptedFaceDescriptor);
            const encryptedFaceDescriptor = (0, crypto_2.symmetricEncrypt)(rawDescriptorStr);
            const serverEncryptedPrivateKey = (0, crypto_2.symmetricEncrypt)(encryptedPrivateKey);
            await user_repository_1.UserRepository.toggleFaceLogin(userId, true, encryptedFaceDescriptor, serverEncryptedPrivateKey);
        }
        else {
            await user_repository_1.UserRepository.toggleFaceLogin(userId, false);
        }
        res.json({ success: true, faceEnabled });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to toggle face login' });
    }
});
// Delete account completely
router.post('/delete-account', auth_middleware_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { password, inTransitEncryptedFaceDescriptor } = req.body;
        const user = await user_repository_1.UserRepository.findById(userId);
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        let verified = false;
        // Verify by password
        if (password) {
            verified = await bcrypt_1.default.compare(password, user.passwordHash);
        }
        // Or verify by face
        else if (inTransitEncryptedFaceDescriptor && user.faceEnabled && user.encryptedFaceDescriptor) {
            const rawDescriptorStr = (0, crypto_2.decryptInTransitPayload)(inTransitEncryptedFaceDescriptor);
            const incomingDesc = JSON.parse(rawDescriptorStr);
            const storedDescStr = (0, crypto_2.symmetricDecrypt)(user.encryptedFaceDescriptor);
            const storedDesc = JSON.parse(storedDescStr);
            const distance = (0, crypto_2.calculateDistance)(incomingDesc, storedDesc);
            if (distance < 0.4) {
                verified = true;
            }
        }
        if (!verified) {
            return res.status(401).json({ error: 'Authentication failed. Incorrect password or face.' });
        }
        // 1. Physically wipe all message payloads sent by this user from the database
        await chat_repository_1.ChatRepository.wipeUserMessagesContent(userId);
        // 2. Delete user profile and all friendships
        await user_repository_1.UserRepository.deleteUser(userId);
        res.json({ success: true, message: 'Account permanently deleted.' });
    }
    catch (error) {
        console.error("Delete account error:", error);
        res.status(500).json({ error: 'Failed to delete account' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.routes.js.map
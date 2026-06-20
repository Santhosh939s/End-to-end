"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const User_1 = __importDefault(require("../models/User"));
const chat_repository_1 = require("../repositories/chat.repository");
const user_repository_1 = require("../repositories/user.repository");
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = require("../utils/crypto");
const router = (0, express_1.Router)();
// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
    if (!req.user?.isAdmin) {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
    next();
};
// GET /api/admin/users
// Get all users (except the admin themselves)
router.get('/users', auth_middleware_1.authenticateToken, requireAdmin, async (req, res) => {
    try {
        const adminId = req.user.id;
        // Return all users except the admin, and omit sensitive fields
        const users = await User_1.default.find({ id: { $ne: adminId } }).select('id username email fullName bio createdAt');
        res.json(users);
    }
    catch (error) {
        console.error('Failed to fetch users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});
// POST /api/admin/users/:id/delete
// Verify admin identity, then wipe user's chat history and delete their account
router.post('/users/:id/delete', auth_middleware_1.authenticateToken, requireAdmin, async (req, res) => {
    try {
        const adminId = req.user.id;
        const { password, inTransitEncryptedFaceDescriptor } = req.body;
        const adminUser = await User_1.default.findOne({ id: adminId });
        if (!adminUser)
            return res.status(401).json({ error: 'Admin account not found.' });
        if (!password && !inTransitEncryptedFaceDescriptor) {
            return res.status(400).json({ error: 'Verification required. Please provide password or face scan.' });
        }
        // Identity Verification (Sudo Mode)
        if (password) {
            const isValid = await bcrypt_1.default.compare(password, adminUser.passwordHash);
            if (!isValid)
                return res.status(401).json({ error: 'Incorrect admin password.' });
        }
        else if (inTransitEncryptedFaceDescriptor) {
            if (!adminUser.faceEnabled || !adminUser.encryptedFaceDescriptor) {
                return res.status(400).json({ error: 'Face Login is not enabled for your admin account.' });
            }
            try {
                const rawDescriptorStr = (0, crypto_1.decryptInTransitPayload)(inTransitEncryptedFaceDescriptor);
                const incomingDesc = JSON.parse(rawDescriptorStr);
                const storedDescStr = (0, crypto_1.symmetricDecrypt)(adminUser.encryptedFaceDescriptor);
                const storedDesc = JSON.parse(storedDescStr);
                const distance = (0, crypto_1.calculateDistance)(incomingDesc, storedDesc);
                if (distance >= 0.4) {
                    return res.status(401).json({ error: 'Face not recognized.' });
                }
            }
            catch (err) {
                console.error('Face verification failed:', err);
                return res.status(401).json({ error: 'Face verification failed.' });
            }
        }
        const targetUserId = req.params.id;
        const user = await User_1.default.findOne({ id: targetUserId });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (user.isAdmin) {
            return res.status(403).json({ error: 'Cannot delete another admin account.' });
        }
        // 1. Physically wipe all message payloads sent by this user from the database
        // This uses the exact same function as regular account deletion
        await chat_repository_1.ChatRepository.wipeUserMessagesContent(targetUserId);
        // 2. Delete user profile and all friendships
        await user_repository_1.UserRepository.deleteUser(targetUserId);
        res.json({ success: true, message: 'User account and messages permanently wiped.' });
    }
    catch (error) {
        console.error("Admin user deletion error:", error);
        res.status(500).json({ error: 'Failed to delete user account' });
    }
});
exports.default = router;
//# sourceMappingURL=admin.routes.js.map
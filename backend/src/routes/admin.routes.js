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
// DELETE /api/admin/users/:id
// Wipe user's chat history and delete their account completely
router.delete('/users/:id', auth_middleware_1.authenticateToken, requireAdmin, async (req, res) => {
    try {
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
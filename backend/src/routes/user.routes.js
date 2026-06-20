"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_repository_1 = require("../repositories/user.repository");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Secure all user routes
router.use(auth_middleware_1.authenticateToken);
// Search users
router.get('/', async (req, res) => {
    try {
        const query = req.query.q || '';
        const users = await user_repository_1.UserRepository.search(query);
        // Filter out the current user from results
        const filteredUsers = users.filter(u => u.id !== req.user?.id);
        res.json(filteredUsers);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to search users' });
    }
});
router.get('/:username', async (req, res) => {
    try {
        const username = req.params.username;
        const user = await user_repository_1.UserRepository.findByUsername(username);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Don't return sensitive info
        const { passwordHash, encryptedPrivateKey, keySalt, serverEncryptedPrivateKey, encryptedFaceDescriptor, ...safeUser } = user;
        res.json(safeUser);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get user' });
    }
});
exports.default = router;
//# sourceMappingURL=user.routes.js.map
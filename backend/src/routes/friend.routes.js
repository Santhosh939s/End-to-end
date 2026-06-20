"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const crypto_1 = require("crypto");
const friend_repository_1 = require("../repositories/friend.repository");
const chat_repository_1 = require("../repositories/chat.repository");
const auth_middleware_1 = require("../middleware/auth.middleware");
const user_repository_1 = require("../repositories/user.repository");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticateToken);
// Send a friend request
router.post('/requests/send', async (req, res) => {
    try {
        const { targetUserId } = req.body;
        const currentUserId = req.user.id;
        if (targetUserId === currentUserId) {
            return res.status(400).json({ error: 'Cannot send request to yourself' });
        }
        const targetUser = await user_repository_1.UserRepository.findById(targetUserId);
        if (!targetUser)
            return res.status(404).json({ error: 'Target user not found' });
        // Check if relationship already exists
        const existing = await friend_repository_1.FriendRepository.findFriendshipBetweenUsers(currentUserId, targetUserId);
        if (existing) {
            return res.status(400).json({ error: 'Relationship already exists' });
        }
        const friendship = await friend_repository_1.FriendRepository.createFriendRequest((0, crypto_1.randomUUID)(), currentUserId, targetUserId);
        res.json(friendship);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to send request' });
    }
});
// Accept a friend request
router.post('/requests/:id/accept', async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const friendship = await friend_repository_1.FriendRepository.findFriendshipById(req.params.id);
        if (!friendship)
            return res.status(404).json({ error: 'Request not found' });
        if (friendship.actionUserId === currentUserId)
            return res.status(400).json({ error: 'Cannot accept your own request' });
        if (friendship.status !== 'pending')
            return res.status(400).json({ error: 'Request already processed' });
        const updated = await friend_repository_1.FriendRepository.updateFriendshipStatus(friendship.id, 'accepted', currentUserId);
        // Automatically create a conversation when accepted
        const conversationId = (0, crypto_1.randomUUID)();
        await chat_repository_1.ChatRepository.createConversation(conversationId, friendship.user1Id, friendship.user2Id);
        res.json({ friendship: updated, conversationId });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to accept request' });
    }
});
// Reject a friend request
router.post('/requests/:id/reject', async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const friendship = await friend_repository_1.FriendRepository.findFriendshipById(req.params.id);
        if (!friendship)
            return res.status(404).json({ error: 'Request not found' });
        if (friendship.actionUserId === currentUserId)
            return res.status(400).json({ error: 'Cannot reject your own request' });
        if (friendship.status !== 'pending')
            return res.status(400).json({ error: 'Request already processed' });
        // Assuming reject deletes the request or sets status to 'blocked'/deleted. Let's delete it.
        await friend_repository_1.FriendRepository.deleteFriendship(friendship.id);
        res.json({ success: true, message: 'Friend request rejected' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to reject request' });
    }
});
// Get all friends and requests for current user
router.get('/', async (req, res) => {
    try {
        const friendships = await friend_repository_1.FriendRepository.getUserFriendships(req.user.id);
        // Enrich with user data
        const enriched = await Promise.all(friendships.map(async (f) => {
            const otherUserId = f.user1Id === req.user.id ? f.user2Id : f.user1Id;
            const otherUser = await user_repository_1.UserRepository.findById(otherUserId);
            return {
                ...f,
                otherUser: otherUser ? {
                    id: otherUser.id,
                    username: otherUser.username,
                    fullName: otherUser.fullName,
                    publicKey: otherUser.publicKey
                } : {
                    id: otherUserId,
                    username: 'deleted',
                    fullName: 'Deleted User',
                    publicKey: ''
                }
            };
        }));
        res.json(enriched);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch friendships' });
    }
});
exports.default = router;
//# sourceMappingURL=friend.routes.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const crypto_1 = require("crypto");
const chat_repository_1 = require("../repositories/chat.repository");
const user_repository_1 = require("../repositories/user.repository");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticateToken);
// Get all conversations for current user
router.get('/', async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const conversations = await chat_repository_1.ChatRepository.getUserConversations(currentUserId);
        // Enrich with other user's info
        const enriched = await Promise.all(conversations.map(async (c) => {
            const otherUserId = c.user1Id === currentUserId ? c.user2Id : c.user1Id;
            const otherUser = await user_repository_1.UserRepository.findById(otherUserId);
            return {
                ...c,
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
        res.status(500).json({ error: 'Failed to fetch conversations' });
    }
});
// Get messages for a conversation
router.get('/:id/messages', async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const conversation = await chat_repository_1.ChatRepository.findConversationById(req.params.id);
        if (!conversation)
            return res.status(404).json({ error: 'Conversation not found' });
        if (conversation.user1Id !== currentUserId && conversation.user2Id !== currentUserId) {
            return res.status(403).json({ error: 'Access denied' });
        }
        const messages = await chat_repository_1.ChatRepository.getConversationMessages(conversation.id);
        res.json(messages);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});
// Send a new encrypted message
router.post('/messages/send', async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const { conversationId, receiverId, encryptedContent, iv, encryptedKeyForReceiver, encryptedKeyForSender } = req.body;
        const conversation = await chat_repository_1.ChatRepository.findConversationById(conversationId);
        if (!conversation)
            return res.status(404).json({ error: 'Conversation not found' });
        if (conversation.user1Id !== currentUserId && conversation.user2Id !== currentUserId) {
            return res.status(403).json({ error: 'Access denied' });
        }
        const message = await chat_repository_1.ChatRepository.createMessage({
            id: (0, crypto_1.randomUUID)(),
            conversationId,
            senderId: currentUserId,
            receiverId,
            encryptedContent,
            iv,
            encryptedKeyForReceiver,
            encryptedKeyForSender
        });
        res.status(201).json(message);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to send message' });
    }
});
exports.default = router;
//# sourceMappingURL=chat.routes.js.map
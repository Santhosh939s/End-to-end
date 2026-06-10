import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ChatRepository } from '../repositories/chat.repository';
import { UserRepository } from '../repositories/user.repository';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticateToken);

// Get all conversations for current user
router.get('/', async (req: AuthRequest, res) => {
  try {
    const currentUserId = req.user!.id;
    const conversations = await ChatRepository.getUserConversations(currentUserId);
    
    // Enrich with other user's info
    const enriched = await Promise.all(conversations.map(async c => {
      const otherUserId = c.user1Id === currentUserId ? c.user2Id : c.user1Id;
      const otherUser = await UserRepository.findById(otherUserId);
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
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get messages for a conversation
router.get('/:id/messages', async (req: AuthRequest, res) => {
  try {
    const currentUserId = req.user!.id;
    const conversation = await ChatRepository.findConversationById(req.params.id);
    
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    if (conversation.user1Id !== currentUserId && conversation.user2Id !== currentUserId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const messages = await ChatRepository.getConversationMessages(conversation.id);
    res.json(messages);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send a new encrypted message
router.post('/messages/send', async (req: AuthRequest, res) => {
  try {
    const currentUserId = req.user!.id;
    const { 
      conversationId, 
      receiverId, 
      encryptedContent, 
      iv, 
      encryptedKeyForReceiver, 
      encryptedKeyForSender 
    } = req.body;

    const conversation = await ChatRepository.findConversationById(conversationId);
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    if (conversation.user1Id !== currentUserId && conversation.user2Id !== currentUserId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const message = await ChatRepository.createMessage({
      id: uuidv4(),
      conversationId,
      senderId: currentUserId,
      receiverId,
      encryptedContent,
      iv,
      encryptedKeyForReceiver,
      encryptedKeyForSender
    });

    res.status(201).json(message);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;

import { Router } from 'express';
import { randomUUID } from 'crypto';
import { FriendRepository } from '../repositories/friend.repository';
import { ChatRepository } from '../repositories/chat.repository';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { UserRepository } from '../repositories/user.repository';

const router = Router();
router.use(authenticateToken);

// Send a friend request
router.post('/requests/send', async (req: AuthRequest, res) => {
  try {
    const { targetUserId } = req.body;
    const currentUserId = req.user!.id;

    if (targetUserId === currentUserId) {
      return res.status(400).json({ error: 'Cannot send request to yourself' });
    }

    const targetUser = await UserRepository.findById(targetUserId);
    if (!targetUser) return res.status(404).json({ error: 'Target user not found' });

    // Check if relationship already exists
    const existing = await FriendRepository.findFriendshipBetweenUsers(currentUserId, targetUserId);
    if (existing) {
      return res.status(400).json({ error: 'Relationship already exists' });
    }

    const friendship = await FriendRepository.createFriendRequest(
      randomUUID(),
      currentUserId,
      targetUserId
    );

    res.json(friendship);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to send request' });
  }
});

// Accept a friend request
router.post('/requests/:id/accept', async (req: AuthRequest, res) => {
  try {
    const currentUserId = req.user!.id;
    const friendship = await FriendRepository.findFriendshipById(req.params.id as string);

    if (!friendship) return res.status(404).json({ error: 'Request not found' });
    if (friendship.actionUserId === currentUserId) return res.status(400).json({ error: 'Cannot accept your own request' });
    if (friendship.status !== 'pending') return res.status(400).json({ error: 'Request already processed' });

    const updated = await FriendRepository.updateFriendshipStatus(friendship.id, 'accepted', currentUserId);

    // Automatically create a conversation when accepted
    const conversationId = randomUUID();
    await ChatRepository.createConversation(conversationId, friendship.user1Id, friendship.user2Id);

    res.json({ friendship: updated, conversationId });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to accept request' });
  }
});

// Reject a friend request
router.post('/requests/:id/reject', async (req: AuthRequest, res) => {
  try {
    const currentUserId = req.user!.id;
    const friendship = await FriendRepository.findFriendshipById(req.params.id as string);

    if (!friendship) return res.status(404).json({ error: 'Request not found' });
    if (friendship.actionUserId === currentUserId) return res.status(400).json({ error: 'Cannot reject your own request' });
    if (friendship.status !== 'pending') return res.status(400).json({ error: 'Request already processed' });

    // Assuming reject deletes the request or sets status to 'blocked'/deleted. Let's delete it.
    await FriendRepository.deleteFriendship(friendship.id);
    res.json({ success: true, message: 'Friend request rejected' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to reject request' });
  }
});

// Get all friends and requests for current user
router.get('/', async (req: AuthRequest, res) => {
  try {
    const friendships = await FriendRepository.getUserFriendships(req.user!.id);
    
    // Enrich with user data
    const enriched = await Promise.all(friendships.map(async f => {
      const otherUserId = f.user1Id === req.user!.id ? f.user2Id : f.user1Id;
      const otherUser = await UserRepository.findById(otherUserId);
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
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch friendships' });
  }
});

export default router;

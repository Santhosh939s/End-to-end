import { Router, Request, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import User from '../models/User';
import { ChatRepository } from '../repositories/chat.repository';
import { UserRepository } from '../repositories/user.repository';
import bcrypt from 'bcrypt';
import { decryptInTransitPayload, symmetricDecrypt, calculateDistance } from '../utils/crypto';

const router = Router();

// Middleware to check if user is admin
const requireAdmin = (req: AuthRequest, res: Response, next: Function) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
  next();
};

// GET /api/admin/users
// Get all users (except the admin themselves)
router.get('/users', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const adminId = req.user!.id;
    // Return all users except the admin, and omit sensitive fields
    const users = await User.find({ id: { $ne: adminId } }).select('id username email fullName bio createdAt');
    res.json(users);
  } catch (error: any) {
    console.error('Failed to fetch users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /api/admin/users/:id/delete
// Verify admin identity, then wipe user's chat history and delete their account
router.post('/users/:id/delete', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const adminId = req.user!.id;
    const { password, inTransitEncryptedFaceDescriptor } = req.body;

    const adminUser = await User.findOne({ id: adminId });
    if (!adminUser) return res.status(401).json({ error: 'Admin account not found.' });

    if (!password && !inTransitEncryptedFaceDescriptor) {
      return res.status(400).json({ error: 'Verification required. Please provide password or face scan.' });
    }

    // Identity Verification (Sudo Mode)
    if (password) {
      const isValid = await bcrypt.compare(password, adminUser.passwordHash);
      if (!isValid) return res.status(401).json({ error: 'Incorrect admin password.' });
    } else if (inTransitEncryptedFaceDescriptor) {
      if (!adminUser.faceEnabled || !adminUser.encryptedFaceDescriptor) {
         return res.status(400).json({ error: 'Face Login is not enabled for your admin account.' });
      }
      
      try {
        const rawDescriptorStr = decryptInTransitPayload(inTransitEncryptedFaceDescriptor);
        const incomingDesc = JSON.parse(rawDescriptorStr) as number[];
        
        const storedDescStr = symmetricDecrypt(adminUser.encryptedFaceDescriptor);
        const storedDesc = JSON.parse(storedDescStr) as number[];
        
        const distance = calculateDistance(incomingDesc, storedDesc);
        
        if (distance >= 0.4) {
          return res.status(401).json({ error: 'Face not recognized.' });
        }
      } catch (err) {
        console.error('Face verification failed:', err);
        return res.status(401).json({ error: 'Face verification failed.' });
      }
    }

    const targetUserId = req.params.id as string;
    
    const user = await User.findOne({ id: targetUserId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isAdmin) {
      return res.status(403).json({ error: 'Cannot delete another admin account.' });
    }

    // 1. Physically wipe all message payloads sent by this user from the database
    // This uses the exact same function as regular account deletion
    await ChatRepository.wipeUserMessagesContent(targetUserId);

    // 2. Delete user profile and all friendships
    await UserRepository.deleteUser(targetUserId);

    res.json({ success: true, message: 'User account and messages permanently wiped.' });
  } catch (error: any) {
    console.error("Admin user deletion error:", error);
    res.status(500).json({ error: 'Failed to delete user account' });
  }
});

export default router;

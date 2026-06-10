import { Router } from 'express';
import { UserRepository } from '../repositories/user.repository';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Secure all user routes
router.use(authenticateToken);

// Search users
router.get('/', async (req: AuthRequest, res) => {
  try {
    const query = req.query.q as string || '';
    const users = await UserRepository.search(query);
    
    // Filter out the current user from results
    const filteredUsers = users.filter(u => u.id !== req.user?.id);
    
    res.json(filteredUsers);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to search users' });
  }
});

router.get('/:username', async (req: AuthRequest, res) => {
  try {
    const username = req.params.username as string;
    const user = await UserRepository.findByUsername(username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Don't return sensitive info
    const { passwordHash, encryptedPrivateKey, keySalt, serverEncryptedPrivateKey, encryptedFaceDescriptor, ...safeUser } = user as any;
    res.json(safeUser);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get user' });
  }
});

export default router;

import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { UserRepository } from '../repositories/user.repository';
import { ChatRepository } from '../repositories/chat.repository';
import { z } from 'zod';
import { getServerKeys, decryptInTransitPayload, symmetricEncrypt, symmetricDecrypt, calculateDistance } from '../utils/crypto';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_cipherlink_key_for_dev';

const registerSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-z0-9_.]+$/),
  email: z.string().email(),
  fullName: z.string().min(1),
  password: z.string().min(6), // The raw password to be hashed for login
  publicKey: z.string(),
  encryptedPrivateKey: z.string(),
  keySalt: z.string(),
  faceEnabled: z.boolean().optional(),
  inTransitEncryptedFaceDescriptor: z.string().optional(),
});

router.get('/server-key', (req, res) => {
  res.json({ publicKey: getServerKeys().publicKey });
});

router.post('/register', async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);

    const existingUser = await UserRepository.findByUsername(data.username);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const id = randomUUID();

    let encryptedFaceDescriptor = null;
    let serverEncryptedPrivateKey = null;

    if (data.faceEnabled && data.inTransitEncryptedFaceDescriptor) {
      // 1. Decrypt the biometric payload (which was encrypted by frontend using Server Public Key)
      const rawDescriptorStr = decryptInTransitPayload(data.inTransitEncryptedFaceDescriptor);
      
      // 2. Encrypt symmetrically for database at-rest storage
      encryptedFaceDescriptor = symmetricEncrypt(rawDescriptorStr);
      
      // 3. Encrypt the private key with the Server Secret so they can log in via Face later
      if (req.body.rawPrivateKeyForEscrow) {
        serverEncryptedPrivateKey = symmetricEncrypt(req.body.rawPrivateKeyForEscrow);
      } else {
        serverEncryptedPrivateKey = symmetricEncrypt(data.encryptedPrivateKey);
      }
    }

    const user = await UserRepository.create({
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

    res.status(201).json({ message: 'User registered successfully', userId: id, isAdmin: user.isAdmin });
  } catch (error: any) {
    console.error('Registration Error:', error);
    res.status(400).json({ error: error.message || 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await UserRepository.findByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, isAdmin: user.isAdmin }, JWT_SECRET, { expiresIn: '7d' });

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
  } catch (error: any) {
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
    const rawDescriptorStr = decryptInTransitPayload(inTransitEncryptedFaceDescriptor);
    const liveDescriptor = JSON.parse(rawDescriptorStr) as number[];

    // 2. 1-to-N Search against all face-enabled users
    const users = await UserRepository.getAllFaceEnabledUsers();
    let bestMatch = null;
    let minDistance = 0.55; // Threshold for face matching

    for (const user of users) {
      if (!user.encryptedFaceDescriptor) continue;
      
      // Decrypt stored descriptor
      const storedStr = symmetricDecrypt(user.encryptedFaceDescriptor);
      const storedDescriptor = JSON.parse(storedStr) as number[];
      
      const distance = calculateDistance(liveDescriptor, storedDescriptor);
      if (distance < minDistance) {
        minDistance = distance;
        bestMatch = user;
      }
    }

    if (!bestMatch) {
      return res.status(401).json({ error: 'Face not recognized' });
    }

    // 3. User is recognized! Unlock the server escrow key
    const decryptedPrivateKey = symmetricDecrypt(bestMatch.serverEncryptedPrivateKey!);

    const token = jwt.sign({ id: bestMatch.id, username: bestMatch.username, isAdmin: bestMatch.isAdmin }, JWT_SECRET, { expiresIn: '7d' });

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

  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Face login failed' });
  }
});

router.post('/toggle-face', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { faceEnabled, inTransitEncryptedFaceDescriptor, encryptedPrivateKey } = req.body;
    const userId = req.user!.id;
    
    const user = await UserRepository.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (faceEnabled) {
      if (!inTransitEncryptedFaceDescriptor || !encryptedPrivateKey) {
        return res.status(400).json({ error: 'Missing face data or private key' });
      }
      
      const rawDescriptorStr = decryptInTransitPayload(inTransitEncryptedFaceDescriptor);
      const encryptedFaceDescriptor = symmetricEncrypt(rawDescriptorStr);
      const serverEncryptedPrivateKey = symmetricEncrypt(encryptedPrivateKey);
      
      await UserRepository.toggleFaceLogin(userId, true, encryptedFaceDescriptor, serverEncryptedPrivateKey);
    } else {
      await UserRepository.toggleFaceLogin(userId, false);
    }

    res.json({ success: true, faceEnabled });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Failed to toggle face login' });
  }
});

// Delete account completely
router.post('/delete-account', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { password, inTransitEncryptedFaceDescriptor } = req.body;
    
    const user = await UserRepository.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let verified = false;

    // Verify by password
    if (password) {
      verified = await bcrypt.compare(password, user.passwordHash);
    } 
    // Or verify by face
    else if (inTransitEncryptedFaceDescriptor && user.faceEnabled && user.encryptedFaceDescriptor) {
      const rawDescriptorStr = decryptInTransitPayload(inTransitEncryptedFaceDescriptor);
      const incomingDesc = JSON.parse(rawDescriptorStr) as number[];
      const storedDescStr = symmetricDecrypt(user.encryptedFaceDescriptor);
      const storedDesc = JSON.parse(storedDescStr) as number[];
      
      const distance = calculateDistance(incomingDesc, storedDesc);
      if (distance < 0.4) {
        verified = true;
      }
    }

    if (!verified) {
      return res.status(401).json({ error: 'Authentication failed. Incorrect password or face.' });
    }

    // 1. Physically wipe all message payloads sent by this user from the database
    await ChatRepository.wipeUserMessagesContent(userId);

    // 2. Delete user profile and all friendships
    await UserRepository.deleteUser(userId);

    res.json({ success: true, message: 'Account permanently deleted.' });
  } catch (error: any) {
    console.error("Delete account error:", error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

export default router;

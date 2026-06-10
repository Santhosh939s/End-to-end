import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import chatRoutes from './routes/chat.routes';
import friendRoutes from './routes/friend.routes';
import userRoutes from './routes/user.routes';
import { connectDB } from './db/db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'CipherLink backend is running.' });
});

// Connect to MongoDB
connectDB().then(() => {
  // Only listen on a port if not running in Vercel Serverless (production)
  if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  }
});

// Export the Express API for Vercel Serverless
export default app;

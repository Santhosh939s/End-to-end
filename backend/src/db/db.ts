import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cipherlink';

// Global cache to prevent multiple connections in Vercel Serverless
let cached: mongoose.Connection | null = null;

export const connectDB = async () => {
  if (cached) {
    console.log('MongoDB: Using cached connection');
    return cached;
  }

  try {
    const conn = await mongoose.connect(MONGO_URI);
    cached = conn.connection;
    console.log('MongoDB Connected successfully to:', MONGO_URI);
    return cached;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
};

export default mongoose;

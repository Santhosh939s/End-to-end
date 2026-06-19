import mongoose, { Schema, Document } from 'mongoose';
import { randomUUID } from 'crypto';

export interface IUser extends Document {
  id: string; // Using string id (randomUUID) instead of default ObjectId to maintain compatibility with existing frontend
  username: string;
  email: string;
  fullName: string;
  passwordHash: string;
  publicKey: string;
  encryptedPrivateKey: string;
  keySalt: string;
  faceEnabled: number;
  encryptedFaceDescriptor: string | null;
  serverEncryptedPrivateKey: string | null;
  bio: string;
  isAdmin: boolean;
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  passwordHash: { type: String, required: true },
  publicKey: { type: String, required: true },
  encryptedPrivateKey: { type: String, required: true },
  keySalt: { type: String, required: true },
  faceEnabled: { type: Number, default: 0 },
  encryptedFaceDescriptor: { type: String, default: null },
  serverEncryptedPrivateKey: { type: String, default: null },
  bio: { type: String, default: '' },
  isAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IUser>('User', UserSchema);

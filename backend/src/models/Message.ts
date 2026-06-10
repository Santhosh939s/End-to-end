import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  encryptedContent: string;
  iv: string;
  encryptedKeyForReceiver: string;
  encryptedKeyForSender: string;
  status: string;
  createdAt: Date;
}

const MessageSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  conversationId: { type: String, required: true },
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  encryptedContent: { type: String, default: '' },
  iv: { type: String, default: '' },
  encryptedKeyForReceiver: { type: String, default: '' },
  encryptedKeyForSender: { type: String, default: '' },
  status: { type: String, default: 'sent' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IMessage>('Message', MessageSchema);

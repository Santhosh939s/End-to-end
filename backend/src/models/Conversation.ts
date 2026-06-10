import mongoose, { Schema, Document } from 'mongoose';

export interface IConversation extends Document {
  id: string;
  user1Id: string;
  user2Id: string;
  createdAt: Date;
}

const ConversationSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  user1Id: { type: String, required: true },
  user2Id: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IConversation>('Conversation', ConversationSchema);

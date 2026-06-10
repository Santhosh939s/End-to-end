import mongoose, { Schema, Document } from 'mongoose';

export interface IFriendship extends Document {
  id: string;
  user1Id: string;
  user2Id: string;
  status: 'pending' | 'accepted' | 'blocked';
  actionUserId: string;
  createdAt: Date;
}

const FriendshipSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  user1Id: { type: String, required: true },
  user2Id: { type: String, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'blocked'], required: true },
  actionUserId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IFriendship>('Friendship', FriendshipSchema);

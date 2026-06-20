import mongoose, { Document } from 'mongoose';
export interface IFriendship extends Document {
    id: string;
    user1Id: string;
    user2Id: string;
    status: 'pending' | 'accepted' | 'blocked';
    actionUserId: string;
    createdAt: Date;
}
declare const _default: mongoose.Model<IFriendship, {}, {}, {}, mongoose.Document<unknown, {}, IFriendship, {}, mongoose.DefaultSchemaOptions> & IFriendship & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, IFriendship>;
export default _default;
//# sourceMappingURL=Friendship.d.ts.map
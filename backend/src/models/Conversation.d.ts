import mongoose, { Document } from 'mongoose';
export interface IConversation extends Document {
    id: string;
    user1Id: string;
    user2Id: string;
    createdAt: Date;
}
declare const _default: mongoose.Model<IConversation, {}, {}, {}, mongoose.Document<unknown, {}, IConversation, {}, mongoose.DefaultSchemaOptions> & IConversation & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, IConversation>;
export default _default;
//# sourceMappingURL=Conversation.d.ts.map
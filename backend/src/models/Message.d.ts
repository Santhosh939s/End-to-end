import mongoose, { Document } from 'mongoose';
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
declare const _default: mongoose.Model<IMessage, {}, {}, {}, mongoose.Document<unknown, {}, IMessage, {}, mongoose.DefaultSchemaOptions> & IMessage & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, IMessage>;
export default _default;
//# sourceMappingURL=Message.d.ts.map
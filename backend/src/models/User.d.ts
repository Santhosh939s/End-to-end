import mongoose, { Document } from 'mongoose';
export interface IUser extends Document {
    id: string;
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
declare const _default: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}, mongoose.DefaultSchemaOptions> & IUser & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, IUser>;
export default _default;
//# sourceMappingURL=User.d.ts.map
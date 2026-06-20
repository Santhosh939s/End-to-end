import mongoose, { Document } from 'mongoose';
export interface IOtp extends Document {
    email: string;
    otp: string;
    createdAt: Date;
}
declare const _default: mongoose.Model<IOtp, {}, {}, {}, mongoose.Document<unknown, {}, IOtp, {}, mongoose.DefaultSchemaOptions> & IOtp & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IOtp>;
export default _default;
//# sourceMappingURL=Otp.d.ts.map
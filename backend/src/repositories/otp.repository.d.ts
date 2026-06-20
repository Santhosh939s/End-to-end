export declare class OtpRepository {
    static createOtp(email: string, otp: string): Promise<import("mongoose").Document<unknown, {}, import("../models/Otp").IOtp, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Otp").IOtp & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static verifyOtp(email: string, otp: string): Promise<boolean>;
}
//# sourceMappingURL=otp.repository.d.ts.map
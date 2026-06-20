export declare class UserRepository {
    static create(user: any): Promise<(import("../models/User").IUser & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }) | null>;
    static findByUsername(username: string): Promise<(import("../models/User").IUser & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }) | null>;
    static findById(id: string): Promise<(import("../models/User").IUser & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }) | null>;
    static search(query: string): Promise<(import("../models/User").IUser & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    static getAllFaceEnabledUsers(): Promise<(import("../models/User").IUser & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    static toggleFaceLogin(userId: string, faceEnabled: boolean, encryptedFaceDescriptor?: string | null, serverEncryptedPrivateKey?: string | null): Promise<void>;
    static deleteUser(userId: string): Promise<void>;
}
//# sourceMappingURL=user.repository.d.ts.map
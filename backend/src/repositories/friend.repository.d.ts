export declare class FriendRepository {
    static createFriendRequest(id: string, senderId: string, receiverId: string): Promise<(import("../models/Friendship").IFriendship & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }) | null>;
    static findFriendshipById(id: string): Promise<(import("../models/Friendship").IFriendship & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }) | null>;
    static findFriendshipBetweenUsers(user1Id: string, user2Id: string): Promise<(import("../models/Friendship").IFriendship & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }) | null>;
    static updateFriendshipStatus(id: string, status: 'accepted' | 'blocked', actionUserId: string): Promise<(import("../models/Friendship").IFriendship & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }) | null>;
    static deleteFriendship(id: string): Promise<void>;
    static getUserFriendships(userId: string): Promise<(import("../models/Friendship").IFriendship & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
}
//# sourceMappingURL=friend.repository.d.ts.map
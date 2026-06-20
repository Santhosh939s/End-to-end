"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FriendRepository = void 0;
const Friendship_1 = __importDefault(require("../models/Friendship"));
class FriendRepository {
    static async createFriendRequest(id, senderId, receiverId) {
        const newReq = new Friendship_1.default({
            id,
            user1Id: senderId,
            user2Id: receiverId,
            status: 'pending',
            actionUserId: senderId
        });
        await newReq.save();
        return this.findFriendshipById(id);
    }
    static async findFriendshipById(id) {
        return Friendship_1.default.findOne({ id }).lean();
    }
    static async findFriendshipBetweenUsers(user1Id, user2Id) {
        return Friendship_1.default.findOne({
            $or: [
                { user1Id, user2Id },
                { user1Id: user2Id, user2Id: user1Id }
            ]
        }).lean();
    }
    static async updateFriendshipStatus(id, status, actionUserId) {
        await Friendship_1.default.updateOne({ id }, { $set: { status, actionUserId } });
        return this.findFriendshipById(id);
    }
    static async deleteFriendship(id) {
        await Friendship_1.default.deleteOne({ id });
    }
    static async getUserFriendships(userId) {
        return Friendship_1.default.find({
            $or: [{ user1Id: userId }, { user2Id: userId }]
        }).lean();
    }
}
exports.FriendRepository = FriendRepository;
//# sourceMappingURL=friend.repository.js.map
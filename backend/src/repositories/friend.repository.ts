import Friendship from '../models/Friendship';

export class FriendRepository {
  static async createFriendRequest(id: string, senderId: string, receiverId: string) {
    const newReq = new Friendship({
      id,
      user1Id: senderId,
      user2Id: receiverId,
      status: 'pending',
      actionUserId: senderId
    });
    await newReq.save();
    return this.findFriendshipById(id);
  }

  static async findFriendshipById(id: string) {
    return Friendship.findOne({ id }).lean();
  }

  static async findFriendshipBetweenUsers(user1Id: string, user2Id: string) {
    return Friendship.findOne({
      $or: [
        { user1Id, user2Id },
        { user1Id: user2Id, user2Id: user1Id }
      ]
    }).lean();
  }

  static async updateFriendshipStatus(id: string, status: 'accepted' | 'blocked', actionUserId: string) {
    await Friendship.updateOne(
      { id },
      { $set: { status, actionUserId } }
    );
    return this.findFriendshipById(id);
  }

  static async deleteFriendship(id: string) {
    await Friendship.deleteOne({ id });
  }

  static async getUserFriendships(userId: string) {
    return Friendship.find({
      $or: [{ user1Id: userId }, { user2Id: userId }]
    }).lean();
  }
}

import User from '../models/User';
import Friendship from '../models/Friendship';

export class UserRepository {
  static async create(user: any) {
    const userToInsert = {
      ...user,
      faceEnabled: user.faceEnabled ? 1 : 0,
      encryptedFaceDescriptor: user.encryptedFaceDescriptor || null,
      serverEncryptedPrivateKey: user.serverEncryptedPrivateKey || null
    };
    
    const newUser = new User(userToInsert);
    await newUser.save();
    return this.findById(user.id);
  }

  static async findByUsername(username: string) {
    return User.findOne({ username }).lean();
  }

  static async findById(id: string) {
    return User.findOne({ id }).lean();
  }

  static async search(query: string) {
    const searchPattern = new RegExp(query, 'i');
    return User.find({
      $or: [
        { username: searchPattern },
        { fullName: searchPattern }
      ]
    }).select('id username email fullName publicKey bio createdAt faceEnabled').lean();
  }

  static async getAllFaceEnabledUsers() {
    return User.find({ faceEnabled: 1 }).lean();
  }

  static async toggleFaceLogin(userId: string, faceEnabled: boolean, encryptedFaceDescriptor: string | null = null, serverEncryptedPrivateKey: string | null = null): Promise<void> {
    await User.updateOne(
      { id: userId },
      { 
        $set: { 
          faceEnabled: faceEnabled ? 1 : 0, 
          encryptedFaceDescriptor, 
          serverEncryptedPrivateKey 
        } 
      }
    );
  }

  static async deleteUser(userId: string): Promise<void> {
    await Friendship.deleteMany({ $or: [{ user1Id: userId }, { user2Id: userId }] });
    await User.deleteOne({ id: userId });
  }
}

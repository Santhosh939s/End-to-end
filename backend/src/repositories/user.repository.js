"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const User_1 = __importDefault(require("../models/User"));
const Friendship_1 = __importDefault(require("../models/Friendship"));
class UserRepository {
    static async create(user) {
        const userToInsert = {
            ...user,
            faceEnabled: user.faceEnabled ? 1 : 0,
            encryptedFaceDescriptor: user.encryptedFaceDescriptor || null,
            serverEncryptedPrivateKey: user.serverEncryptedPrivateKey || null
        };
        const newUser = new User_1.default(userToInsert);
        await newUser.save();
        return this.findById(user.id);
    }
    static async findByUsername(username) {
        return User_1.default.findOne({ username }).lean();
    }
    static async findById(id) {
        return User_1.default.findOne({ id }).lean();
    }
    static async search(query) {
        const searchPattern = new RegExp(query, 'i');
        return User_1.default.find({
            $or: [
                { username: searchPattern },
                { fullName: searchPattern }
            ]
        }).select('id username email fullName publicKey bio createdAt faceEnabled').lean();
    }
    static async getAllFaceEnabledUsers() {
        return User_1.default.find({ faceEnabled: 1 }).lean();
    }
    static async toggleFaceLogin(userId, faceEnabled, encryptedFaceDescriptor = null, serverEncryptedPrivateKey = null) {
        await User_1.default.updateOne({ id: userId }, {
            $set: {
                faceEnabled: faceEnabled ? 1 : 0,
                encryptedFaceDescriptor,
                serverEncryptedPrivateKey
            }
        });
    }
    static async deleteUser(userId) {
        await Friendship_1.default.deleteMany({ $or: [{ user1Id: userId }, { user2Id: userId }] });
        await User_1.default.deleteOne({ id: userId });
    }
}
exports.UserRepository = UserRepository;
//# sourceMappingURL=user.repository.js.map
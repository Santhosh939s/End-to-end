"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatRepository = void 0;
const Conversation_1 = __importDefault(require("../models/Conversation"));
const Message_1 = __importDefault(require("../models/Message"));
class ChatRepository {
    static async createConversation(id, user1Id, user2Id) {
        const newConv = new Conversation_1.default({ id, user1Id, user2Id });
        await newConv.save();
        return this.findConversationById(id);
    }
    static async findConversationById(id) {
        return Conversation_1.default.findOne({ id }).lean();
    }
    static async findConversationBetweenUsers(user1Id, user2Id) {
        return Conversation_1.default.findOne({
            $or: [
                { user1Id, user2Id },
                { user1Id: user2Id, user2Id: user1Id }
            ]
        }).lean();
    }
    static async getUserConversations(userId) {
        return Conversation_1.default.find({
            $or: [{ user1Id: userId }, { user2Id: userId }]
        }).lean();
    }
    static async createMessage(message) {
        const newMsg = new Message_1.default(message);
        await newMsg.save();
        return this.findMessageById(message.id);
    }
    static async findMessageById(id) {
        return Message_1.default.findOne({ id }).lean();
    }
    static async getConversationMessages(conversationId) {
        return Message_1.default.find({ conversationId }).sort({ createdAt: 1 }).lean();
    }
    static async wipeUserMessagesContent(senderId) {
        await Message_1.default.updateMany({ senderId }, {
            $set: {
                encryptedContent: '',
                iv: '',
                encryptedKeyForReceiver: '',
                encryptedKeyForSender: ''
            }
        });
    }
}
exports.ChatRepository = ChatRepository;
//# sourceMappingURL=chat.repository.js.map
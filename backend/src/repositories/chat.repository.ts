import Conversation from '../models/Conversation';
import Message from '../models/Message';

export class ChatRepository {
  static async createConversation(id: string, user1Id: string, user2Id: string) {
    const newConv = new Conversation({ id, user1Id, user2Id });
    await newConv.save();
    return this.findConversationById(id);
  }

  static async findConversationById(id: string) {
    return Conversation.findOne({ id }).lean();
  }

  static async findConversationBetweenUsers(user1Id: string, user2Id: string) {
    return Conversation.findOne({
      $or: [
        { user1Id, user2Id },
        { user1Id: user2Id, user2Id: user1Id }
      ]
    }).lean();
  }

  static async getUserConversations(userId: string) {
    return Conversation.find({
      $or: [{ user1Id: userId }, { user2Id: userId }]
    }).lean();
  }

  static async createMessage(message: any) {
    const newMsg = new Message(message);
    await newMsg.save();
    return this.findMessageById(message.id);
  }

  static async findMessageById(id: string) {
    return Message.findOne({ id }).lean();
  }

  static async getConversationMessages(conversationId: string) {
    return Message.find({ conversationId }).sort({ createdAt: 1 }).lean();
  }

  static async wipeUserMessagesContent(senderId: string): Promise<void> {
    await Message.updateMany(
      { senderId },
      { 
        $set: { 
          encryptedContent: '', 
          iv: '', 
          encryptedKeyForReceiver: '', 
          encryptedKeyForSender: '' 
        } 
      }
    );
  }
}

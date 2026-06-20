export declare class ChatRepository {
    static createConversation(id: string, user1Id: string, user2Id: string): Promise<(import("../models/Conversation").IConversation & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }) | null>;
    static findConversationById(id: string): Promise<(import("../models/Conversation").IConversation & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }) | null>;
    static findConversationBetweenUsers(user1Id: string, user2Id: string): Promise<(import("../models/Conversation").IConversation & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }) | null>;
    static getUserConversations(userId: string): Promise<(import("../models/Conversation").IConversation & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    static createMessage(message: any): Promise<(import("../models/Message").IMessage & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }) | null>;
    static findMessageById(id: string): Promise<(import("../models/Message").IMessage & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }) | null>;
    static getConversationMessages(conversationId: string): Promise<(import("../models/Message").IMessage & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    static wipeUserMessagesContent(senderId: string): Promise<void>;
}
//# sourceMappingURL=chat.repository.d.ts.map
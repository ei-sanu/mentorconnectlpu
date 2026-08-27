import { Model } from 'mongoose';
import { ConversationDocument } from '../database/schemas/conversation.schema';
import { MessageDocument } from '../database/schemas/message.schema';
import { UserDocument } from '../database/schemas/user.schema';
export declare class MessagingService {
    private readonly conversationModel;
    private readonly messageModel;
    private readonly userModel;
    constructor(conversationModel: Model<ConversationDocument>, messageModel: Model<MessageDocument>, userModel: Model<UserDocument>);
    getConversations(userId: string): Promise<any[]>;
    getMessages(conversationId: string, userId: string, limit?: number, before?: string): Promise<{
        id: any;
        content: any;
        senderId: any;
        senderName: string;
        createdAt: any;
    }[]>;
    sendMessage(conversationId: string, senderId: string, content: string): Promise<{
        id: string;
        conversationId: string;
        content: string;
        senderId: string;
        senderName: string;
        createdAt: any;
    }>;
}

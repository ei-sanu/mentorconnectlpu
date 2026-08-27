import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagingService } from './messaging.service';
import { Model } from 'mongoose';
import { UserDocument } from '../database/schemas/user.schema';
import { ConversationDocument } from '../database/schemas/conversation.schema';
export declare class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly messagingService;
    private readonly userModel;
    private readonly conversationModel;
    private readonly logger;
    server: Server;
    constructor(messagingService: MessagingService, userModel: Model<UserDocument>, conversationModel: Model<ConversationDocument>);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    handleJoinConversation(client: Socket, data: {
        conversationId: string;
    }): Promise<void>;
    handleSendMessage(client: Socket, data: {
        conversationId: string;
        content: string;
    }): Promise<void>;
    handleTyping(client: Socket, data: {
        conversationId: string;
        isTyping: boolean;
    }): void;
}

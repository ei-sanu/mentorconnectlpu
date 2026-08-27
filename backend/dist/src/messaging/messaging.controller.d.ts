import { MessagingService } from './messaging.service';
export declare class MessagingController {
    private readonly messagingService;
    constructor(messagingService: MessagingService);
    getConversations(user: any): Promise<any>;
    getMessages(conversationId: string, user: any, limit?: number, before?: string): Promise<any>;
    sendMessage(conversationId: string, user: any, content: string): Promise<any>;
}

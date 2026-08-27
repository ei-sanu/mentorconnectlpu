import { Model } from 'mongoose';
import { NotificationDocument } from '../database/schemas/notification.schema';
export declare class NotificationsService {
    private readonly notificationModel;
    constructor(notificationModel: Model<NotificationDocument>);
    create(userId: string, type: string, title: string, message: string, metadata?: any): Promise<any>;
    findAll(userId: string): Promise<any[]>;
    markAsRead(id: string, userId: string): Promise<any>;
    markAllAsRead(userId: string): Promise<any>;
}

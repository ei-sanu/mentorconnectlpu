import { Model } from 'mongoose';
import { UserDocument } from '../database/schemas/user.schema';
export declare class EmailService {
    private readonly userModel;
    private readonly logger;
    private resend;
    constructor(userModel: Model<UserDocument>);
    sendNotificationEmail(userId: string, type: string, title: string, message: string): Promise<void>;
}

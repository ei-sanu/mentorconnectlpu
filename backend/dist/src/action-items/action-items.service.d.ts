import { Model } from 'mongoose';
import { ActionItemDocument } from '../database/schemas/action-item.schema';
import { MentorshipDocument } from '../database/schemas/mentorship.schema';
import { CreateActionItemDto } from './dto/create-action-item.dto';
import { NotificationsService } from '../notifications/notifications.service';
export declare class ActionItemsService {
    private readonly actionItemModel;
    private readonly mentorshipModel;
    private readonly notifications;
    constructor(actionItemModel: Model<ActionItemDocument>, mentorshipModel: Model<MentorshipDocument>, notifications: NotificationsService);
    findActionItemsForMentorship(mentorshipId: string, userId: string): Promise<any[]>;
    createActionItem(mentorshipId: string, userId: string, dto: CreateActionItemDto): Promise<any>;
    updateActionItem(id: string, userId: string, dto: any): Promise<any>;
}

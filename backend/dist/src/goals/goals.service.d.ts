import { Model } from 'mongoose';
import { GoalDocument } from '../database/schemas/goal.schema';
import { MentorshipDocument } from '../database/schemas/mentorship.schema';
import { CreateGoalDto } from './dto/create-goal.dto';
import { NotificationsService } from '../notifications/notifications.service';
export declare class GoalsService {
    private readonly goalModel;
    private readonly mentorshipModel;
    private readonly notifications;
    constructor(goalModel: Model<GoalDocument>, mentorshipModel: Model<MentorshipDocument>, notifications: NotificationsService);
    findGoalsForMentorship(mentorshipId: string, userId: string): Promise<any[]>;
    createGoal(mentorshipId: string, userId: string, dto: CreateGoalDto): Promise<any>;
    updateGoal(id: string, userId: string, dto: any): Promise<any>;
    deleteGoal(id: string, userId: string): Promise<any>;
}

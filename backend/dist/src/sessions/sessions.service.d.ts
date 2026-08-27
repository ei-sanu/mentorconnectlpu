import { Model } from 'mongoose';
import { SessionDocument } from '../database/schemas/session.schema';
import { MentorshipDocument } from '../database/schemas/mentorship.schema';
import { CreateSessionDto } from './dto/create-session.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';
import { CalendarService } from '../calendar/calendar.service';
export declare class SessionsService {
    private readonly sessionModel;
    private readonly mentorshipModel;
    private readonly notifications;
    private readonly calendar;
    private readonly audit;
    constructor(sessionModel: Model<SessionDocument>, mentorshipModel: Model<MentorshipDocument>, notifications: NotificationsService, calendar: CalendarService, audit: AuditService);
    findSessionsForMentorship(mentorshipId: string, userId: string): Promise<any[]>;
    createSession(mentorshipId: string, userId: string, dto: CreateSessionDto): Promise<any>;
    updateSession(id: string, userId: string, dto: any): Promise<any>;
    cancelSession(id: string, userId: string): Promise<any>;
}

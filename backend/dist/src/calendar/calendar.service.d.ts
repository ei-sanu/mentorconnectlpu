import { Model } from 'mongoose';
import { CalendarIntegrationDocument } from '../database/schemas/calendar-integration.schema';
import { SessionDocument } from '../database/schemas/session.schema';
import { SessionsService } from '../sessions/sessions.service';
export declare class CalendarService {
    private readonly integrationModel;
    private readonly sessionModel;
    private readonly sessionsService;
    private readonly logger;
    private readonly algorithm;
    private readonly key;
    constructor(integrationModel: Model<CalendarIntegrationDocument>, sessionModel: Model<SessionDocument>, sessionsService: SessionsService);
    private encrypt;
    private decrypt;
    saveGoogleCredentials(userId: string, code: string): Promise<{
        success: boolean;
        message: string;
    }>;
    syncSessionEvent(sessionId: string): Promise<void>;
    private syncToGoogle;
    private syncToMicrosoft;
    disconnect(userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}

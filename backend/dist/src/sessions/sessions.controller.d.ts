import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
export declare class SessionsController {
    private readonly sessionsService;
    constructor(sessionsService: SessionsService);
    getSessions(mentorshipId: string, user: any): Promise<any>;
    createSession(mentorshipId: string, user: any, dto: CreateSessionDto): Promise<any>;
    updateSession(id: string, user: any, dto: any): Promise<any>;
    cancelSession(id: string, user: any): Promise<any>;
}

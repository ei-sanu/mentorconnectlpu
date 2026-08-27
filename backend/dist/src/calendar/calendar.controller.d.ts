import { CalendarService } from './calendar.service';
export declare class CalendarController {
    private readonly calendarService;
    constructor(calendarService: CalendarService);
    googleCallback(code: string, user: any): Promise<{
        success: boolean;
        message: string;
    }>;
    disconnect(user: any): Promise<{
        success: boolean;
        message: string;
    }>;
}

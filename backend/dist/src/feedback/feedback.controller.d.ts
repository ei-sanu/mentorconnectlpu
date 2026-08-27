import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
export declare class FeedbackController {
    private readonly feedbackService;
    constructor(feedbackService: FeedbackService);
    createFeedback(mentorshipId: string, user: any, dto: CreateFeedbackDto): Promise<any>;
    getFeedback(mentorshipId: string, user: any): Promise<any>;
}

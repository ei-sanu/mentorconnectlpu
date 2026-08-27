import { Model, Types } from 'mongoose';
import { FeedbackDocument } from '../database/schemas/feedback.schema';
import { MentorshipDocument } from '../database/schemas/mentorship.schema';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
export declare class FeedbackService {
    private readonly feedbackModel;
    private readonly mentorshipModel;
    constructor(feedbackModel: Model<FeedbackDocument>, mentorshipModel: Model<MentorshipDocument>);
    createFeedback(mentorshipId: string, submitterId: string, dto: CreateFeedbackDto): Promise<{
        id: string;
        mentorshipId: Types.ObjectId;
        submitterId: Types.ObjectId;
        rating: number;
        comments?: string;
        usefulness?: number;
        learningOutcome?: string;
        preparedness?: number;
        progressScore?: number;
        engagement?: number;
        _id: Types.ObjectId;
        $locals: Record<string, unknown>;
        $op: "save" | "validate" | "remove" | null;
        $where: Record<string, unknown>;
        baseModelName?: string;
        collection: import("mongoose").Collection;
        db: import("mongoose").Connection;
        errors?: import("mongoose").Error.ValidationError;
        isNew: boolean;
        schema: import("mongoose").Schema;
        __v: number;
    }>;
    getFeedback(mentorshipId: string, userId: string): Promise<any[]>;
}

import { Document, Schema as MongooseSchema, Types } from 'mongoose';
export type FeedbackDocument = Feedback & Document;
export declare class Feedback {
    mentorshipId: Types.ObjectId;
    submitterId: Types.ObjectId;
    rating: number;
    comments?: string;
    usefulness?: number;
    learningOutcome?: string;
    preparedness?: number;
    progressScore?: number;
    engagement?: number;
}
export declare const FeedbackSchema: MongooseSchema<Feedback, import("mongoose").Model<Feedback, any, any, any, Document<unknown, any, Feedback, any, {}> & Feedback & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Feedback, Document<unknown, {}, import("mongoose").FlatRecord<Feedback>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Feedback> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;

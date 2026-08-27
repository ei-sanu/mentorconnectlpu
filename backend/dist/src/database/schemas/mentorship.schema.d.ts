import { Document, Schema as MongooseSchema, Types } from 'mongoose';
export type MentorshipDocument = Mentorship & Document;
export declare enum MentorshipStatus {
    ACTIVE = "ACTIVE",
    PAUSED = "PAUSED",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED",
    AT_RISK = "AT_RISK",
    INACTIVE = "INACTIVE"
}
export declare class Mentorship {
    studentProfileId: Types.ObjectId;
    mentorProfileId: Types.ObjectId;
    status: MentorshipStatus;
    startDate: Date;
    endDate?: Date;
}
export declare const MentorshipSchema: MongooseSchema<Mentorship, import("mongoose").Model<Mentorship, any, any, any, Document<unknown, any, Mentorship, any, {}> & Mentorship & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Mentorship, Document<unknown, {}, import("mongoose").FlatRecord<Mentorship>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Mentorship> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;

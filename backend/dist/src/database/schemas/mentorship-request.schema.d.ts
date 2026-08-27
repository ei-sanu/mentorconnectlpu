import { Document, Schema as MongooseSchema, Types } from 'mongoose';
export type MentorshipRequestDocument = MentorshipRequest & Document;
export declare enum RequestStatus {
    PENDING = "PENDING",
    ACCEPTED = "ACCEPTED",
    DECLINED = "DECLINED",
    EXPIRED = "EXPIRED",
    CANCELLED = "CANCELLED"
}
export declare class MentorshipRequest {
    studentId: Types.ObjectId;
    mentorId: Types.ObjectId;
    message: string;
    goal: string;
    status: RequestStatus;
}
export declare const MentorshipRequestSchema: MongooseSchema<MentorshipRequest, import("mongoose").Model<MentorshipRequest, any, any, any, Document<unknown, any, MentorshipRequest, any, {}> & MentorshipRequest & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, MentorshipRequest, Document<unknown, {}, import("mongoose").FlatRecord<MentorshipRequest>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<MentorshipRequest> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;

import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { VerificationStatus } from './mentor-profile.schema';
export type AlumniVerificationDocument = AlumniVerification & Document;
export declare class AlumniVerification {
    mentorProfileId?: Types.ObjectId;
    studentProfileId?: Types.ObjectId;
    submittedData: any;
    status: VerificationStatus;
    reviewerId?: Types.ObjectId;
    reviewedAt?: Date;
    rejectionReason?: string;
}
export declare const AlumniVerificationSchema: MongooseSchema<AlumniVerification, import("mongoose").Model<AlumniVerification, any, any, any, Document<unknown, any, AlumniVerification, any, {}> & AlumniVerification & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, AlumniVerification, Document<unknown, {}, import("mongoose").FlatRecord<AlumniVerification>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<AlumniVerification> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;

import { Document, Schema as MongooseSchema, Types } from 'mongoose';
export type MentorProfileDocument = MentorProfile & Document;
export declare enum VerificationStatus {
    PENDING = "PENDING",
    VERIFIED = "VERIFIED",
    REJECTED = "REJECTED",
    EXPIRED = "EXPIRED"
}
export declare enum MentorStatus {
    ACTIVE = "ACTIVE",
    PAUSED = "PAUSED",
    INACTIVE = "INACTIVE"
}
export declare class MentorProfile {
    userId: Types.ObjectId;
    graduationYear: number;
    programme: string;
    currentCompany: string;
    currentDesignation: string;
    yearsOfExperience: number;
    industry: string;
    expertise: string[];
    mentoringAreas: string[];
    bio: string;
    careerSummary: string;
    maxCapacity: number;
    currentMenteesCount: number;
    acceptingMentees: boolean;
    verificationStatus: VerificationStatus;
    status: MentorStatus;
    profileVisibility: boolean;
    mentorEmbedding?: number[];
}
export declare const MentorProfileSchema: MongooseSchema<MentorProfile, import("mongoose").Model<MentorProfile, any, any, any, Document<unknown, any, MentorProfile, any, {}> & MentorProfile & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, MentorProfile, Document<unknown, {}, import("mongoose").FlatRecord<MentorProfile>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<MentorProfile> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;

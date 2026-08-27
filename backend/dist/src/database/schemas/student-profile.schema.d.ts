import { Document, Schema as MongooseSchema, Types } from 'mongoose';
export type StudentProfileDocument = StudentProfile & Document;
export declare class StudentProfile {
    userId: Types.ObjectId;
    programme: string;
    school: string;
    yearOfStudy: number;
    graduationYear: number;
    currentSkills: string[];
    targetRole: string;
    targetIndustry: string;
    careerGoals: string[];
    interests: string[];
    mentoringNeeds: string;
    preferredFrequency: string;
    onboardingStatus: boolean;
    profileCompletion: number;
    profileVisibility: boolean;
    studentEmbedding?: number[];
}
export declare const StudentProfileSchema: MongooseSchema<StudentProfile, import("mongoose").Model<StudentProfile, any, any, any, Document<unknown, any, StudentProfile, any, {}> & StudentProfile & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, StudentProfile, Document<unknown, {}, import("mongoose").FlatRecord<StudentProfile>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<StudentProfile> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;

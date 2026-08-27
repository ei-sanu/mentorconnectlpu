import { Document, HydratedDocument } from 'mongoose';
export type UserDocument = HydratedDocument<User>;
export declare enum Role {
    STUDENT = "STUDENT",
    MENTOR = "MENTOR",
    ALUMNI_OFFICER = "ALUMNI_OFFICER",
    PLACEMENT_OFFICER = "PLACEMENT_OFFICER",
    ADMIN = "ADMIN"
}
export declare enum UserStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    SUSPENDED = "SUSPENDED",
    PENDING = "PENDING"
}
export declare class User extends Document {
    clerkUserId: string;
    email: string;
    role: Role;
    status: UserStatus;
    onboardingStatus: string;
    verificationStatus: string;
    phone?: string;
    phoneDetails?: {
        countryCode: string;
        nationalNumber: string;
        e164: string;
        verified: boolean;
        verifiedAt?: Date;
    };
    phoneVerification?: {
        status: 'NOT_STARTED' | 'PENDING' | 'VERIFIED' | 'FAILED' | 'LOCKED';
        attempts: number;
        lastSentAt?: Date;
        verifiedAt?: Date;
    };
    lpuRegistrationNumber?: string;
    lpuRegistrationNumberNormalized?: string;
    lpuEmail?: string;
    rejectionReason?: string;
    changeRequestReason?: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    lastLoginAt?: Date;
}
export declare const UserSchema: import("mongoose").Schema<User, import("mongoose").Model<User, any, any, any, Document<unknown, any, User, any, {}> & User & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, User, Document<unknown, {}, import("mongoose").FlatRecord<User>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<User> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;

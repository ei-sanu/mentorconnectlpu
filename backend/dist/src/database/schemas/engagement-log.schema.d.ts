import { Document, Schema as MongooseSchema, Types } from 'mongoose';
export type EngagementLogDocument = EngagementLog & Document;
export declare enum RiskLevel {
    HEALTHY = "HEALTHY",
    NEEDS_ATTENTION = "NEEDS_ATTENTION",
    AT_RISK = "AT_RISK",
    INACTIVE = "INACTIVE"
}
export declare class EngagementLog {
    mentorshipId: Types.ObjectId;
    lastInteractionDate: Date;
    sessionsCompletedCount: number;
    sessionsMissedCount: number;
    goalsCompletedCount: number;
    actionItemsCompletedCount: number;
    daysSinceLastInteraction: number;
    riskScore: number;
    riskLevel: RiskLevel;
    reasons: string[];
}
export declare const EngagementLogSchema: MongooseSchema<EngagementLog, import("mongoose").Model<EngagementLog, any, any, any, Document<unknown, any, EngagementLog, any, {}> & EngagementLog & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, EngagementLog, Document<unknown, {}, import("mongoose").FlatRecord<EngagementLog>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<EngagementLog> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;

import { Document, Schema as MongooseSchema, Types } from 'mongoose';
export type GoalDocument = Goal & Document;
export declare enum GoalStatus {
    NOT_STARTED = "NOT_STARTED",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED"
}
export declare class Goal {
    mentorshipId: Types.ObjectId;
    title: string;
    description: string;
    progress: number;
    status: GoalStatus;
    targetDate: Date;
    completedAt?: Date;
}
export declare const GoalSchema: MongooseSchema<Goal, import("mongoose").Model<Goal, any, any, any, Document<unknown, any, Goal, any, {}> & Goal & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Goal, Document<unknown, {}, import("mongoose").FlatRecord<Goal>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Goal> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;

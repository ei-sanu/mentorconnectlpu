import { Document, Schema as MongooseSchema, Types } from 'mongoose';
export type ActionItemDocument = ActionItem & Document;
export declare enum ActionItemStatus {
    PENDING = "PENDING",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    OVERDUE = "OVERDUE"
}
export declare class ActionItem {
    mentorshipId: Types.ObjectId;
    goalId?: Types.ObjectId;
    task: string;
    assignedToId: Types.ObjectId;
    createdById: Types.ObjectId;
    dueDate: Date;
    status: ActionItemStatus;
    completedAt?: Date;
}
export declare const ActionItemSchema: MongooseSchema<ActionItem, import("mongoose").Model<ActionItem, any, any, any, Document<unknown, any, ActionItem, any, {}> & ActionItem & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ActionItem, Document<unknown, {}, import("mongoose").FlatRecord<ActionItem>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<ActionItem> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;

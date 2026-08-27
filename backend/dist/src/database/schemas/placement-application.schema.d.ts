import { Document, Schema as MongooseSchema, Types } from 'mongoose';
export type PlacementApplicationDocument = PlacementApplication & Document;
export declare enum PlacementStatus {
    APPLIED = "APPLIED",
    SHORTLISTED = "SHORTLISTED",
    INTERVIEW_SCHEDULED = "INTERVIEW_SCHEDULED",
    OFFERED = "OFFERED",
    REJECTED = "REJECTED",
    PLACED = "PLACED"
}
export declare class PlacementApplication {
    studentId: Types.ObjectId;
    opportunityId: Types.ObjectId;
    status: PlacementStatus;
    interviewDate?: Date;
    notes: string;
}
export declare const PlacementApplicationSchema: MongooseSchema<PlacementApplication, import("mongoose").Model<PlacementApplication, any, any, any, Document<unknown, any, PlacementApplication, any, {}> & PlacementApplication & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, PlacementApplication, Document<unknown, {}, import("mongoose").FlatRecord<PlacementApplication>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<PlacementApplication> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;

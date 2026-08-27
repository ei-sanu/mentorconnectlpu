import { Document, Schema as MongooseSchema, Types } from 'mongoose';
export type OpportunityApplicationDocument = OpportunityApplication & Document;
export declare enum ApplicationStatus {
    APPLIED = "APPLIED",
    SHORTLISTED = "SHORTLISTED",
    INTERVIEW = "INTERVIEW",
    SELECTED = "SELECTED",
    REJECTED = "REJECTED"
}
export declare class OpportunityApplication {
    opportunityId: Types.ObjectId;
    userId: Types.ObjectId;
    status: ApplicationStatus;
    notes?: string;
}
export declare const OpportunityApplicationSchema: MongooseSchema<OpportunityApplication, import("mongoose").Model<OpportunityApplication, any, any, any, Document<unknown, any, OpportunityApplication, any, {}> & OpportunityApplication & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, OpportunityApplication, Document<unknown, {}, import("mongoose").FlatRecord<OpportunityApplication>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<OpportunityApplication> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;

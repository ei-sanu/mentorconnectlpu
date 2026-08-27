import { Document, Schema as MongooseSchema, Types } from 'mongoose';
export type OpportunityDocument = Opportunity & Document;
export declare enum OpportunityType {
    FULL_TIME = "FULL_TIME",
    INTERNSHIP = "INTERNSHIP",
    CO_OP = "CO_OP",
    HACKATHON = "HACKATHON",
    REFERRAL = "REFERRAL"
}
export declare enum OpportunityStatus {
    UPCOMING = "UPCOMING",
    ACTIVE = "ACTIVE",
    CLOSED = "CLOSED"
}
export declare class Opportunity {
    title: string;
    company: string;
    type: OpportunityType;
    location?: string;
    description?: string;
    status: OpportunityStatus;
    postedBy: Types.ObjectId;
    applyBy?: Date;
}
export declare const OpportunitySchema: MongooseSchema<Opportunity, import("mongoose").Model<Opportunity, any, any, any, Document<unknown, any, Opportunity, any, {}> & Opportunity & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Opportunity, Document<unknown, {}, import("mongoose").FlatRecord<Opportunity>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Opportunity> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;

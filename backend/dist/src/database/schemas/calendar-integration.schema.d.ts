import { Document, Schema as MongooseSchema, Types } from 'mongoose';
export type CalendarIntegrationDocument = CalendarIntegration & Document;
export declare class CalendarIntegration {
    userId: Types.ObjectId;
    provider: string;
    accessToken: string;
    refreshToken: string;
    expiryDate: Date;
    scopes: string[];
}
export declare const CalendarIntegrationSchema: MongooseSchema<CalendarIntegration, import("mongoose").Model<CalendarIntegration, any, any, any, Document<unknown, any, CalendarIntegration, any, {}> & CalendarIntegration & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, CalendarIntegration, Document<unknown, {}, import("mongoose").FlatRecord<CalendarIntegration>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<CalendarIntegration> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;

import { Document, Schema as MongooseSchema, Types } from 'mongoose';
export type NotificationDocument = Notification & Document;
export declare class Notification {
    userId: Types.ObjectId;
    type: string;
    title: string;
    message: string;
    read: boolean;
    metadata?: any;
}
export declare const NotificationSchema: MongooseSchema<Notification, import("mongoose").Model<Notification, any, any, any, Document<unknown, any, Notification, any, {}> & Notification & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Notification, Document<unknown, {}, import("mongoose").FlatRecord<Notification>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Notification> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;

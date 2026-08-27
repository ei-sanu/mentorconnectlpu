import { Document, Schema as MongooseSchema, Types } from 'mongoose';
export type MessageDocument = Message & Document;
export declare class Message {
    conversationId: Types.ObjectId;
    senderId: Types.ObjectId;
    content: string;
}
export declare const MessageSchema: MongooseSchema<Message, import("mongoose").Model<Message, any, any, any, Document<unknown, any, Message, any, {}> & Message & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Message, Document<unknown, {}, import("mongoose").FlatRecord<Message>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Message> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;

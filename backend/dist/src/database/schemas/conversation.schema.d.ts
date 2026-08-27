import { Document, Schema as MongooseSchema, Types } from 'mongoose';
export type ConversationDocument = Conversation & Document;
export declare class Conversation {
    mentorshipId: Types.ObjectId;
    participants: Types.ObjectId[];
}
export declare const ConversationSchema: MongooseSchema<Conversation, import("mongoose").Model<Conversation, any, any, any, Document<unknown, any, Conversation, any, {}> & Conversation & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Conversation, Document<unknown, {}, import("mongoose").FlatRecord<Conversation>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Conversation> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;

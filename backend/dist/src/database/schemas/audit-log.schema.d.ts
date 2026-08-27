import { Document, Schema as MongooseSchema, Types } from 'mongoose';
export type AuditLogDocument = AuditLog & Document;
export declare class AuditLog {
    actorId?: Types.ObjectId;
    action: string;
    entity: string;
    entityId: string;
    metadata?: any;
    ipAddress?: string;
}
export declare const AuditLogSchema: MongooseSchema<AuditLog, import("mongoose").Model<AuditLog, any, any, any, Document<unknown, any, AuditLog, any, {}> & AuditLog & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, AuditLog, Document<unknown, {}, import("mongoose").FlatRecord<AuditLog>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<AuditLog> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;

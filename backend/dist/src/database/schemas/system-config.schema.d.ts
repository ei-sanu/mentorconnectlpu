import { Document, Schema as MongooseSchema } from 'mongoose';
export type SystemConfigDocument = SystemConfig & Document;
export declare class SystemConfig {
    key: string;
    value: any;
}
export declare const SystemConfigSchema: MongooseSchema<SystemConfig, import("mongoose").Model<SystemConfig, any, any, any, Document<unknown, any, SystemConfig, any, {}> & SystemConfig & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, SystemConfig, Document<unknown, {}, import("mongoose").FlatRecord<SystemConfig>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<SystemConfig> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;

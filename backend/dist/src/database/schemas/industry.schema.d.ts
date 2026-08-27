import { Document } from 'mongoose';
export type IndustryDocument = Industry & Document;
export declare class Industry {
    name: string;
}
export declare const IndustrySchema: import("mongoose").Schema<Industry, import("mongoose").Model<Industry, any, any, any, Document<unknown, any, Industry, any, {}> & Industry & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Industry, Document<unknown, {}, import("mongoose").FlatRecord<Industry>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Industry> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;

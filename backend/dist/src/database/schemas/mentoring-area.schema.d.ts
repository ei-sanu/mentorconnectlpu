import { Document } from 'mongoose';
export type MentoringAreaDocument = MentoringArea & Document;
export declare class MentoringArea {
    name: string;
}
export declare const MentoringAreaSchema: import("mongoose").Schema<MentoringArea, import("mongoose").Model<MentoringArea, any, any, any, Document<unknown, any, MentoringArea, any, {}> & MentoringArea & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, MentoringArea, Document<unknown, {}, import("mongoose").FlatRecord<MentoringArea>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<MentoringArea> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;

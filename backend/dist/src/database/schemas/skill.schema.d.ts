import { Document } from 'mongoose';
export type SkillDocument = Skill & Document;
export declare class Skill {
    name: string;
}
export declare const SkillSchema: import("mongoose").Schema<Skill, import("mongoose").Model<Skill, any, any, any, Document<unknown, any, Skill, any, {}> & Skill & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Skill, Document<unknown, {}, import("mongoose").FlatRecord<Skill>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Skill> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;

import { Document } from 'mongoose';
export type CareerGoalDocument = CareerGoal & Document;
export declare class CareerGoal {
    name: string;
}
export declare const CareerGoalSchema: import("mongoose").Schema<CareerGoal, import("mongoose").Model<CareerGoal, any, any, any, Document<unknown, any, CareerGoal, any, {}> & CareerGoal & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, CareerGoal, Document<unknown, {}, import("mongoose").FlatRecord<CareerGoal>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<CareerGoal> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;

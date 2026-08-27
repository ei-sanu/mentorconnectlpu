import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CareerGoalDocument = CareerGoal & Document;

@Schema({ timestamps: true })
export class CareerGoal {
  @Prop({ required: true, unique: true, index: true })
  name: string;
}

export const CareerGoalSchema = SchemaFactory.createForClass(CareerGoal);

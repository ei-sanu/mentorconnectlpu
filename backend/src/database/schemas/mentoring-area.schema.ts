import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MentoringAreaDocument = MentoringArea & Document;

@Schema({ timestamps: true })
export class MentoringArea {
  @Prop({ required: true, unique: true, index: true })
  name: string;
}

export const MentoringAreaSchema = SchemaFactory.createForClass(MentoringArea);

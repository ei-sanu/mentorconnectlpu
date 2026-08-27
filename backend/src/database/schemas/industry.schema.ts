import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type IndustryDocument = Industry & Document;

@Schema({ timestamps: true })
export class Industry {
  @Prop({ required: true, unique: true, index: true })
  name: string;
}

export const IndustrySchema = SchemaFactory.createForClass(Industry);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type CalendarIntegrationDocument = CalendarIntegration & Document;

@Schema({ timestamps: true })
export class CalendarIntegration {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  provider: string; // "GOOGLE" | "MICROSOFT"

  @Prop({ required: true })
  accessToken: string; // encrypted

  @Prop({ required: true })
  refreshToken: string; // encrypted

  @Prop({ required: true, type: Date })
  expiryDate: Date;

  @Prop({ type: [String], default: [] })
  scopes: string[];
}

export const CalendarIntegrationSchema = SchemaFactory.createForClass(CalendarIntegration);
// Single provider integration per user
CalendarIntegrationSchema.index({ userId: 1, provider: 1 }, { unique: true });

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type AvailabilityDocument = Availability & Document;

@Schema({ timestamps: true })
export class Availability {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'MentorProfile', required: true, index: true })
  mentorProfileId: Types.ObjectId;

  @Prop({ required: true, type: Number })
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  @Prop({ required: true })
  startTime: string; // e.g. "10:00"

  @Prop({ required: true })
  endTime: string; // e.g. "11:00"

  @Prop({ required: true, default: 'Asia/Kolkata' })
  timezone: string;
}

export const AvailabilitySchema = SchemaFactory.createForClass(Availability);
// Avoid duplicate time-slot registration for the same mentor
AvailabilitySchema.index({ mentorProfileId: 1, dayOfWeek: 1, startTime: 1 }, { unique: true });

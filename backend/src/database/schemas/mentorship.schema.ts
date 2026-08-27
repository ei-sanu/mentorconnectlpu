import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type MentorshipDocument = Mentorship & Document;

export enum MentorshipStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  AT_RISK = 'AT_RISK',
  INACTIVE = 'INACTIVE',
}

@Schema({ timestamps: true })
export class Mentorship {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'StudentProfile', required: true, index: true })
  studentProfileId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'MentorProfile', required: true, index: true })
  mentorProfileId: Types.ObjectId;

  @Prop({ required: true, default: MentorshipStatus.ACTIVE, enum: MentorshipStatus, index: true })
  status: MentorshipStatus;

  @Prop({ required: true, default: Date.now })
  startDate: Date;

  @Prop()
  endDate?: Date;
}

export const MentorshipSchema = SchemaFactory.createForClass(Mentorship);

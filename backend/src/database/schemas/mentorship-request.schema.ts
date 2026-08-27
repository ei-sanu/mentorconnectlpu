import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type MentorshipRequestDocument = MentorshipRequest & Document;

export enum RequestStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

@Schema({ timestamps: true })
export class MentorshipRequest {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  studentId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'MentorProfile', required: true, index: true })
  mentorId: Types.ObjectId;

  @Prop({ required: true })
  message: string;

  @Prop({ required: true })
  goal: string;

  @Prop({ required: true, default: RequestStatus.PENDING, enum: RequestStatus, index: true })
  status: RequestStatus;
}

export const MentorshipRequestSchema = SchemaFactory.createForClass(MentorshipRequest);

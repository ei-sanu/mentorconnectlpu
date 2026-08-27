import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type SessionDocument = Session & Document;

export enum SessionStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  RESCHEDULED = 'RESCHEDULED',
  NO_SHOW = 'NO_SHOW',
}

export enum CalendarSyncStatus {
  PENDING = 'PENDING',
  FAILED = 'FAILED',
  SYNCED = 'SYNCED',
}

@Schema({ timestamps: true })
export class Session {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Mentorship', required: true, index: true })
  mentorshipId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true, type: Date })
  startTime: Date;

  @Prop({ required: true, type: Date })
  endTime: Date;

  @Prop({ required: true, default: 'Asia/Kolkata' })
  timezone: string;

  @Prop({ required: true, default: SessionStatus.SCHEDULED, enum: SessionStatus, index: true })
  status: SessionStatus;

  @Prop()
  notes?: string;

  @Prop()
  meetingUrl?: string;

  @Prop({ required: true })
  createdBy: string; // User ID string representation

  @Prop()
  calendarEventId?: string;

  @Prop({ required: true, default: CalendarSyncStatus.PENDING, enum: CalendarSyncStatus })
  calendarSyncStatus: CalendarSyncStatus;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
SessionSchema.index({ mentorshipId: 1, startTime: 1 });

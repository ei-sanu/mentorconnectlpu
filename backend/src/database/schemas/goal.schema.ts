import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type GoalDocument = Goal & Document;

export enum GoalStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Schema({ timestamps: true })
export class Goal {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Mentorship', required: true, index: true })
  mentorshipId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: Number, default: 0 })
  progress: number;

  @Prop({ required: true, default: GoalStatus.NOT_STARTED, enum: GoalStatus, index: true })
  status: GoalStatus;

  @Prop({ required: true, type: Date })
  targetDate: Date;

  @Prop({ type: Date })
  completedAt?: Date;
}

export const GoalSchema = SchemaFactory.createForClass(Goal);

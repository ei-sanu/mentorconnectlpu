import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type ActionItemDocument = ActionItem & Document;

export enum ActionItemStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  OVERDUE = 'OVERDUE',
}

@Schema({ timestamps: true })
export class ActionItem {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Mentorship', required: true, index: true })
  mentorshipId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Goal', index: true })
  goalId?: Types.ObjectId;

  @Prop({ required: true })
  task: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  assignedToId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  createdById: Types.ObjectId;

  @Prop({ required: true, type: Date })
  dueDate: Date;

  @Prop({ required: true, default: ActionItemStatus.PENDING, enum: ActionItemStatus, index: true })
  status: ActionItemStatus;

  @Prop({ type: Date })
  completedAt?: Date;
}

export const ActionItemSchema = SchemaFactory.createForClass(ActionItem);

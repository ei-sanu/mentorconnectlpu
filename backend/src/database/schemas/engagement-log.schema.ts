import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type EngagementLogDocument = EngagementLog & Document;

export enum RiskLevel {
  HEALTHY = 'HEALTHY',
  NEEDS_ATTENTION = 'NEEDS_ATTENTION',
  AT_RISK = 'AT_RISK',
  INACTIVE = 'INACTIVE',
}

@Schema({ timestamps: true })
export class EngagementLog {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Mentorship', required: true, unique: true, index: true })
  mentorshipId: Types.ObjectId;

  @Prop({ required: true, type: Date, default: Date.now })
  lastInteractionDate: Date;

  @Prop({ type: Number, default: 0 })
  sessionsCompletedCount: number;

  @Prop({ type: Number, default: 0 })
  sessionsMissedCount: number;

  @Prop({ type: Number, default: 0 })
  goalsCompletedCount: number;

  @Prop({ type: Number, default: 0 })
  actionItemsCompletedCount: number;

  @Prop({ type: Number, default: 0 })
  daysSinceLastInteraction: number;

  @Prop({ type: Number, default: 0.0 })
  riskScore: number;

  @Prop({ required: true, default: RiskLevel.HEALTHY, enum: RiskLevel, index: true })
  riskLevel: RiskLevel;

  @Prop({ type: [String], default: [] })
  reasons: string[];
}

export const EngagementLogSchema = SchemaFactory.createForClass(EngagementLog);

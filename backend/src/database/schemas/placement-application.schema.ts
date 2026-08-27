import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type PlacementApplicationDocument = PlacementApplication & Document;

export enum PlacementStatus {
  APPLIED = 'APPLIED',
  SHORTLISTED = 'SHORTLISTED',
  INTERVIEW_SCHEDULED = 'INTERVIEW_SCHEDULED',
  OFFERED = 'OFFERED',
  REJECTED = 'REJECTED',
  PLACED = 'PLACED',
}

@Schema({ timestamps: true })
export class PlacementApplication {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  studentId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Opportunity', required: true, index: true })
  opportunityId: Types.ObjectId;

  @Prop({ type: String, enum: PlacementStatus, default: PlacementStatus.APPLIED, index: true })
  status: PlacementStatus;

  @Prop({ type: Date })
  interviewDate?: Date;

  @Prop({ type: String, default: '' })
  notes: string;
}

export const PlacementApplicationSchema = SchemaFactory.createForClass(PlacementApplication);

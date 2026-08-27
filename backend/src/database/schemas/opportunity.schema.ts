import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type OpportunityDocument = Opportunity & Document;

export enum OpportunityType {
  FULL_TIME = 'FULL_TIME',
  INTERNSHIP = 'INTERNSHIP',
  CO_OP = 'CO_OP',
  HACKATHON = 'HACKATHON',
  REFERRAL = 'REFERRAL',
}

export enum OpportunityStatus {
  UPCOMING = 'UPCOMING',
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
}

@Schema({ timestamps: true })
export class Opportunity {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  company: string;

  @Prop({ required: true, enum: OpportunityType, default: OpportunityType.FULL_TIME })
  type: OpportunityType;

  @Prop({ default: '' })
  location?: string;

  @Prop({ default: '' })
  description?: string;

  @Prop({ required: true, default: OpportunityStatus.UPCOMING, enum: OpportunityStatus, index: true })
  status: OpportunityStatus;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  postedBy: Types.ObjectId;

  @Prop({ default: Date.now })
  applyBy?: Date;
}

export const OpportunitySchema = SchemaFactory.createForClass(Opportunity);

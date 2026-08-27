import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { Opportunity } from './opportunity.schema';
import { User } from './user.schema';

export type OpportunityApplicationDocument = OpportunityApplication & Document;

export enum ApplicationStatus {
  APPLIED = 'APPLIED',
  SHORTLISTED = 'SHORTLISTED',
  INTERVIEW = 'INTERVIEW',
  SELECTED = 'SELECTED',
  REJECTED = 'REJECTED',
}

@Schema({ timestamps: true })
export class OpportunityApplication {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: Opportunity.name, required: true, index: true })
  opportunityId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: User.name, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, default: ApplicationStatus.APPLIED, enum: ApplicationStatus, index: true })
  status: ApplicationStatus;

  @Prop({ default: '' })
  notes?: string;
}

export const OpportunityApplicationSchema = SchemaFactory.createForClass(OpportunityApplication);
// A student can apply to an opportunity only once
OpportunityApplicationSchema.index({ opportunityId: 1, userId: 1 }, { unique: true });

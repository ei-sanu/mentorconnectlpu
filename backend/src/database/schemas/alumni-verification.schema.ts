import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { VerificationStatus } from './mentor-profile.schema';

export type AlumniVerificationDocument = AlumniVerification & Document;

@Schema({ timestamps: true })
export class AlumniVerification {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'MentorProfile', index: true })
  mentorProfileId?: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'StudentProfile', index: true })
  studentProfileId?: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  submittedData: any;

  @Prop({ required: true, default: VerificationStatus.PENDING, enum: VerificationStatus, index: true })
  status: VerificationStatus;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  reviewerId?: Types.ObjectId;

  @Prop()
  reviewedAt?: Date;

  @Prop()
  rejectionReason?: string;
}

export const AlumniVerificationSchema = SchemaFactory.createForClass(AlumniVerification);

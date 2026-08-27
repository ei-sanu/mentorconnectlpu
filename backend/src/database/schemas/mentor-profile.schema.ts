import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type MentorProfileDocument = MentorProfile & Document;

export enum VerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export enum MentorStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  INACTIVE = 'INACTIVE',
}

@Schema({ timestamps: true })
export class MentorProfile {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, type: Number })
  graduationYear: number;

  @Prop({ required: true })
  programme: string;

  @Prop({ required: true })
  currentCompany: string;

  @Prop({ required: true })
  currentDesignation: string;

  @Prop({ required: true, type: Number })
  yearsOfExperience: number;

  @Prop({ required: true, index: true })
  industry: string;

  @Prop({ type: [String], default: [], index: true })
  expertise: string[];

  @Prop({ type: [String], default: [] })
  mentoringAreas: string[];

  @Prop({ required: true })
  bio: string;

  @Prop({ required: true })
  careerSummary: string;

  @Prop({ type: Number, default: 3 })
  maxCapacity: number;

  @Prop({ type: Number, default: 0 })
  currentMenteesCount: number;

  @Prop({ default: true, index: true })
  acceptingMentees: boolean;

  @Prop({ required: true, default: VerificationStatus.PENDING, index: true, enum: VerificationStatus })
  verificationStatus: VerificationStatus;

  @Prop({ required: true, default: MentorStatus.INACTIVE, index: true, enum: MentorStatus })
  status: MentorStatus;

  @Prop({ default: true })
  profileVisibility: boolean;

  // MongoDB vector search embedding
  @Prop({ type: [Number], index: false })
  mentorEmbedding?: number[];
}

export const MentorProfileSchema = SchemaFactory.createForClass(MentorProfile);

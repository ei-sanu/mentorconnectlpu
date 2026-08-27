import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type StudentProfileDocument = StudentProfile & Document;

@Schema({ timestamps: true })
export class StudentProfile {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  programme: string;

  @Prop({ required: true })
  school: string;

  @Prop({ required: true, type: Number })
  yearOfStudy: number;

  @Prop({ required: true, type: Number })
  graduationYear: number;

  @Prop({ type: [String], default: [] })
  currentSkills: string[];

  @Prop({ required: true })
  targetRole: string;

  @Prop({ required: true })
  targetIndustry: string;

  @Prop({ type: [String], default: [] })
  careerGoals: string[];

  @Prop({ type: [String], default: [] })
  interests: string[];

  @Prop({ required: true })
  mentoringNeeds: string;

  @Prop({ required: true })
  preferredFrequency: string;

  @Prop({ default: false })
  onboardingStatus: boolean;

  @Prop({ type: Number, default: 0 })
  profileCompletion: number;

  @Prop({ default: true })
  profileVisibility: boolean;

  // MongoDB vector search embedding (array of floats)
  @Prop({ type: [Number], index: false })
  studentEmbedding?: number[];
}

export const StudentProfileSchema = SchemaFactory.createForClass(StudentProfile);

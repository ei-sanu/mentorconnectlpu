import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type FeedbackDocument = Feedback & Document;

@Schema({ timestamps: true })
export class Feedback {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Mentorship', required: true, index: true })
  mentorshipId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  submitterId: Types.ObjectId;

  @Prop({ required: true, type: Number })
  rating: number;

  @Prop()
  comments?: string;

  // Student specific feedback fields
  @Prop({ type: Number })
  usefulness?: number;

  @Prop()
  learningOutcome?: string;

  // Mentor specific feedback fields
  @Prop({ type: Number })
  preparedness?: number;

  @Prop({ type: Number })
  progressScore?: number;

  @Prop({ type: Number })
  engagement?: number;
}

export const FeedbackSchema = SchemaFactory.createForClass(Feedback);
// Ensure single feedback per participant on a mentorship
FeedbackSchema.index({ mentorshipId: 1, submitterId: 1 }, { unique: true });

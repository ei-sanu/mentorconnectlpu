import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type ConversationDocument = Conversation & Document;

@Schema({ timestamps: true })
export class Conversation {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Mentorship', required: true, unique: true, index: true })
  mentorshipId: Types.ObjectId;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }], required: true, index: true })
  participants: Types.ObjectId[];
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class AuditLog {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', index: true })
  actorId?: Types.ObjectId;

  @Prop({ required: true, index: true })
  action: string; // e.g. "ROLE_CHANGE", "APPROVE_VERIFICATION"

  @Prop({ required: true, index: true })
  entity: string; // e.g. "User", "AlumniVerification"

  @Prop({ required: true, index: true })
  entityId: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  metadata?: any;

  @Prop()
  ipAddress?: string;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

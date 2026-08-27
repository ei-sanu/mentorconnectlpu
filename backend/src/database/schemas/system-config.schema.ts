import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type SystemConfigDocument = SystemConfig & Document;

@Schema({ timestamps: true })
export class SystemConfig {
  @Prop({ required: true, unique: true, index: true })
  key: string; // e.g. "MATCHING_WEIGHTS"

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  value: any;
}

export const SystemConfigSchema = SchemaFactory.createForClass(SystemConfig);

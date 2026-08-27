import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export enum Role {
  STUDENT = 'STUDENT',
  MENTOR = 'MENTOR',
  ALUMNI_OFFICER = 'ALUMNI_OFFICER',
  PLACEMENT_OFFICER = 'PLACEMENT_OFFICER',
  ADMIN = 'ADMIN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING = 'PENDING',
}

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true, index: true })
  clerkUserId: string;

  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop({ required: true, index: true, enum: Role })
  role: Role;

  @Prop({ required: true, default: UserStatus.ACTIVE, index: true, enum: UserStatus })
  status: UserStatus;

  @Prop({ required: true, default: 'NOT_STARTED', index: true })
  onboardingStatus: string;

  @Prop({ required: true, default: 'NOT_SUBMITTED', index: true })
  verificationStatus: string;

  @Prop()
  phone?: string;

  @Prop({ type: {
    countryCode: { type: String },
    nationalNumber: { type: String },
    e164: { type: String },
    verified: { type: Boolean, default: false },
    verifiedAt: { type: Date }
  }, _id: false })
  phoneDetails?: {
    countryCode: string;
    nationalNumber: string;
    e164: string;
    verified: boolean;
    verifiedAt?: Date;
  };

  @Prop({ type: {
    status: { type: String, default: 'NOT_STARTED', enum: ['NOT_STARTED', 'PENDING', 'VERIFIED', 'FAILED', 'LOCKED'] },
    attempts: { type: Number, default: 0 },
    lastSentAt: { type: Date },
    verifiedAt: { type: Date }
  }, _id: false })
  phoneVerification?: {
    status: 'NOT_STARTED' | 'PENDING' | 'VERIFIED' | 'FAILED' | 'LOCKED';
    attempts: number;
    lastSentAt?: Date;
    verifiedAt?: Date;
  };

  @Prop()
  lpuRegistrationNumber?: string;

  @Prop()
  lpuRegistrationNumberNormalized?: string;

  @Prop()
  lpuEmail?: string;

  @Prop()
  rejectionReason?: string;

  @Prop()
  changeRequestReason?: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop()
  avatar?: string;

  @Prop()
  lastLoginAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { AlumniOfficerController } from './alumni-officer.controller';
import { PlacementOfficerController } from './placement-officer.controller';
import { AuthModule } from '../auth/auth.module';
import { MatchingModule } from '../matching/matching.module';
import {
  AlumniVerification,
  AlumniVerificationSchema,
} from '../database/schemas/alumni-verification.schema';
import {
  MentorProfile,
  MentorProfileSchema,
} from '../database/schemas/mentor-profile.schema';
import {
  StudentProfile,
  StudentProfileSchema,
} from '../database/schemas/student-profile.schema';

@Module({
  imports: [
    AuthModule,
    MatchingModule,
    MongooseModule.forFeature([
      { name: AlumniVerification.name, schema: AlumniVerificationSchema },
      { name: MentorProfile.name, schema: MentorProfileSchema },
      { name: StudentProfile.name, schema: StudentProfileSchema },
    ]),
  ],
  controllers: [AnalyticsController, AlumniOfficerController, PlacementOfficerController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}

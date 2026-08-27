import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { StudentsModule } from './students/students.module';
import { MentorsModule } from './mentors/mentors.module';
import { VerificationModule } from './verification/verification.module';
import { MatchingModule } from './matching/matching.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { RequestsModule } from './requests/requests.module';
import { MentorshipsModule } from './mentorships/mentorships.module';
import { SessionsModule } from './sessions/sessions.module';
import { CalendarModule } from './calendar/calendar.module';
import { GoalsModule } from './goals/goals.module';
import { ActionItemsModule } from './action-items/action-items.module';
import { MessagingModule } from './messaging/messaging.module';
import { NotificationsModule } from './notifications/notifications.module';
import { FeedbackModule } from './feedback/feedback.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AdminModule } from './admin/admin.module';
import { FilesModule } from './files/files.module';
import { EmailModule } from './email/email.module';
import { JobsModule } from './jobs/jobs.module';
import { AuditModule } from './audit/audit.module';
import { HealthModule } from './health/health.module';
import { DashboardEventsModule } from './events/dashboard-events.module';

@Module({
  imports: [
    // Configuration & Scheduler
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),

    // Core Database & Auth
    DatabaseModule,
    AuthModule,
    AuditModule,
    JobsModule,

    // Subsystems
    UsersModule,
    StudentsModule,
    MentorsModule,
    VerificationModule,
    MatchingModule,
    RecommendationsModule,
    RequestsModule,
    MentorshipsModule,
    SessionsModule,
    CalendarModule,
    GoalsModule,
    ActionItemsModule,
    MessagingModule,
    NotificationsModule,
    FeedbackModule,
    AnalyticsModule,
    AdminModule,
    FilesModule,
    EmailModule,
    HealthModule,
    DashboardEventsModule,
  ],
})
export class AppModule {}

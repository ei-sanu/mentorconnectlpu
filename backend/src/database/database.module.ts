import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { User, UserSchema } from './schemas/user.schema';
import { StudentProfile, StudentProfileSchema } from './schemas/student-profile.schema';
import { MentorProfile, MentorProfileSchema } from './schemas/mentor-profile.schema';
import { AlumniVerification, AlumniVerificationSchema } from './schemas/alumni-verification.schema';
import { Availability, AvailabilitySchema } from './schemas/availability.schema';
import { MentorshipRequest, MentorshipRequestSchema } from './schemas/mentorship-request.schema';
import { Mentorship, MentorshipSchema } from './schemas/mentorship.schema';
import { Session, SessionSchema } from './schemas/session.schema';
import { Goal, GoalSchema } from './schemas/goal.schema';
import { ActionItem, ActionItemSchema } from './schemas/action-item.schema';
import { Conversation, ConversationSchema } from './schemas/conversation.schema';
import { Message, MessageSchema } from './schemas/message.schema';
import { Notification, NotificationSchema } from './schemas/notification.schema';
import { Feedback, FeedbackSchema } from './schemas/feedback.schema';
import { EngagementLog, EngagementLogSchema } from './schemas/engagement-log.schema';
import { SystemConfig, SystemConfigSchema } from './schemas/system-config.schema';
import { AuditLog, AuditLogSchema } from './schemas/audit-log.schema';
import { CalendarIntegration, CalendarIntegrationSchema } from './schemas/calendar-integration.schema';
import { Skill, SkillSchema } from './schemas/skill.schema';
import { Industry, IndustrySchema } from './schemas/industry.schema';
import { CareerGoal, CareerGoalSchema } from './schemas/career-goal.schema';
import { MentoringArea, MentoringAreaSchema } from './schemas/mentoring-area.schema';
import { Opportunity, OpportunitySchema } from './schemas/opportunity.schema';
import { PlacementApplication, PlacementApplicationSchema } from './schemas/placement-application.schema';

const MONGO_FEATURES = [
  { name: User.name, schema: UserSchema },
  { name: StudentProfile.name, schema: StudentProfileSchema },
  { name: MentorProfile.name, schema: MentorProfileSchema },
  { name: AlumniVerification.name, schema: AlumniVerificationSchema },
  { name: Availability.name, schema: AvailabilitySchema },
  { name: MentorshipRequest.name, schema: MentorshipRequestSchema },
  { name: Mentorship.name, schema: MentorshipSchema },
  { name: Session.name, schema: SessionSchema },
  { name: Goal.name, schema: GoalSchema },
  { name: ActionItem.name, schema: ActionItemSchema },
  { name: Conversation.name, schema: ConversationSchema },
  { name: Message.name, schema: MessageSchema },
  { name: Notification.name, schema: NotificationSchema },
  { name: Feedback.name, schema: FeedbackSchema },
  { name: EngagementLog.name, schema: EngagementLogSchema },
  { name: SystemConfig.name, schema: SystemConfigSchema },
  { name: AuditLog.name, schema: AuditLogSchema },
  { name: CalendarIntegration.name, schema: CalendarIntegrationSchema },
  { name: Skill.name, schema: SkillSchema },
  { name: Industry.name, schema: IndustrySchema },
  { name: CareerGoal.name, schema: CareerGoalSchema },
  { name: MentoringArea.name, schema: MentoringAreaSchema },
  { name: Opportunity.name, schema: OpportunitySchema },
  { name: PlacementApplication.name, schema: PlacementApplicationSchema },
];

@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: () => {
        const uri = process.env.DATABASE_URL || 'mongodb://localhost:27017/mentorconnect';
        return {
          uri,
        };
      },
    }),
    MongooseModule.forFeature(MONGO_FEATURES),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}

"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const user_schema_1 = require("./schemas/user.schema");
const student_profile_schema_1 = require("./schemas/student-profile.schema");
const mentor_profile_schema_1 = require("./schemas/mentor-profile.schema");
const alumni_verification_schema_1 = require("./schemas/alumni-verification.schema");
const availability_schema_1 = require("./schemas/availability.schema");
const mentorship_request_schema_1 = require("./schemas/mentorship-request.schema");
const mentorship_schema_1 = require("./schemas/mentorship.schema");
const session_schema_1 = require("./schemas/session.schema");
const goal_schema_1 = require("./schemas/goal.schema");
const action_item_schema_1 = require("./schemas/action-item.schema");
const conversation_schema_1 = require("./schemas/conversation.schema");
const message_schema_1 = require("./schemas/message.schema");
const notification_schema_1 = require("./schemas/notification.schema");
const feedback_schema_1 = require("./schemas/feedback.schema");
const engagement_log_schema_1 = require("./schemas/engagement-log.schema");
const system_config_schema_1 = require("./schemas/system-config.schema");
const audit_log_schema_1 = require("./schemas/audit-log.schema");
const calendar_integration_schema_1 = require("./schemas/calendar-integration.schema");
const skill_schema_1 = require("./schemas/skill.schema");
const industry_schema_1 = require("./schemas/industry.schema");
const career_goal_schema_1 = require("./schemas/career-goal.schema");
const mentoring_area_schema_1 = require("./schemas/mentoring-area.schema");
const opportunity_schema_1 = require("./schemas/opportunity.schema");
const placement_application_schema_1 = require("./schemas/placement-application.schema");
const MONGO_FEATURES = [
    { name: user_schema_1.User.name, schema: user_schema_1.UserSchema },
    { name: student_profile_schema_1.StudentProfile.name, schema: student_profile_schema_1.StudentProfileSchema },
    { name: mentor_profile_schema_1.MentorProfile.name, schema: mentor_profile_schema_1.MentorProfileSchema },
    { name: alumni_verification_schema_1.AlumniVerification.name, schema: alumni_verification_schema_1.AlumniVerificationSchema },
    { name: availability_schema_1.Availability.name, schema: availability_schema_1.AvailabilitySchema },
    { name: mentorship_request_schema_1.MentorshipRequest.name, schema: mentorship_request_schema_1.MentorshipRequestSchema },
    { name: mentorship_schema_1.Mentorship.name, schema: mentorship_schema_1.MentorshipSchema },
    { name: session_schema_1.Session.name, schema: session_schema_1.SessionSchema },
    { name: goal_schema_1.Goal.name, schema: goal_schema_1.GoalSchema },
    { name: action_item_schema_1.ActionItem.name, schema: action_item_schema_1.ActionItemSchema },
    { name: conversation_schema_1.Conversation.name, schema: conversation_schema_1.ConversationSchema },
    { name: message_schema_1.Message.name, schema: message_schema_1.MessageSchema },
    { name: notification_schema_1.Notification.name, schema: notification_schema_1.NotificationSchema },
    { name: feedback_schema_1.Feedback.name, schema: feedback_schema_1.FeedbackSchema },
    { name: engagement_log_schema_1.EngagementLog.name, schema: engagement_log_schema_1.EngagementLogSchema },
    { name: system_config_schema_1.SystemConfig.name, schema: system_config_schema_1.SystemConfigSchema },
    { name: audit_log_schema_1.AuditLog.name, schema: audit_log_schema_1.AuditLogSchema },
    { name: calendar_integration_schema_1.CalendarIntegration.name, schema: calendar_integration_schema_1.CalendarIntegrationSchema },
    { name: skill_schema_1.Skill.name, schema: skill_schema_1.SkillSchema },
    { name: industry_schema_1.Industry.name, schema: industry_schema_1.IndustrySchema },
    { name: career_goal_schema_1.CareerGoal.name, schema: career_goal_schema_1.CareerGoalSchema },
    { name: mentoring_area_schema_1.MentoringArea.name, schema: mentoring_area_schema_1.MentoringAreaSchema },
    { name: opportunity_schema_1.Opportunity.name, schema: opportunity_schema_1.OpportunitySchema },
    { name: placement_application_schema_1.PlacementApplication.name, schema: placement_application_schema_1.PlacementApplicationSchema },
];
let DatabaseModule = class DatabaseModule {
};
exports.DatabaseModule = DatabaseModule;
exports.DatabaseModule = DatabaseModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forRootAsync({
                useFactory: () => {
                    const uri = process.env.DATABASE_URL || 'mongodb://localhost:27017/mentorconnect';
                    return {
                        uri,
                    };
                },
            }),
            mongoose_1.MongooseModule.forFeature(MONGO_FEATURES),
        ],
        exports: [mongoose_1.MongooseModule],
    })
], DatabaseModule);
//# sourceMappingURL=database.module.js.map
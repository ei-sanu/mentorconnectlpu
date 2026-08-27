"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const database_module_1 = require("./database/database.module");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const students_module_1 = require("./students/students.module");
const mentors_module_1 = require("./mentors/mentors.module");
const verification_module_1 = require("./verification/verification.module");
const matching_module_1 = require("./matching/matching.module");
const recommendations_module_1 = require("./recommendations/recommendations.module");
const requests_module_1 = require("./requests/requests.module");
const mentorships_module_1 = require("./mentorships/mentorships.module");
const sessions_module_1 = require("./sessions/sessions.module");
const calendar_module_1 = require("./calendar/calendar.module");
const goals_module_1 = require("./goals/goals.module");
const action_items_module_1 = require("./action-items/action-items.module");
const messaging_module_1 = require("./messaging/messaging.module");
const notifications_module_1 = require("./notifications/notifications.module");
const feedback_module_1 = require("./feedback/feedback.module");
const analytics_module_1 = require("./analytics/analytics.module");
const admin_module_1 = require("./admin/admin.module");
const files_module_1 = require("./files/files.module");
const email_module_1 = require("./email/email.module");
const jobs_module_1 = require("./jobs/jobs.module");
const audit_module_1 = require("./audit/audit.module");
const health_module_1 = require("./health/health.module");
const dashboard_events_module_1 = require("./events/dashboard-events.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            schedule_1.ScheduleModule.forRoot(),
            database_module_1.DatabaseModule,
            auth_module_1.AuthModule,
            audit_module_1.AuditModule,
            jobs_module_1.JobsModule,
            users_module_1.UsersModule,
            students_module_1.StudentsModule,
            mentors_module_1.MentorsModule,
            verification_module_1.VerificationModule,
            matching_module_1.MatchingModule,
            recommendations_module_1.RecommendationsModule,
            requests_module_1.RequestsModule,
            mentorships_module_1.MentorshipsModule,
            sessions_module_1.SessionsModule,
            calendar_module_1.CalendarModule,
            goals_module_1.GoalsModule,
            action_items_module_1.ActionItemsModule,
            messaging_module_1.MessagingModule,
            notifications_module_1.NotificationsModule,
            feedback_module_1.FeedbackModule,
            analytics_module_1.AnalyticsModule,
            admin_module_1.AdminModule,
            files_module_1.FilesModule,
            email_module_1.EmailModule,
            health_module_1.HealthModule,
            dashboard_events_module_1.DashboardEventsModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map
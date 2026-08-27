"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var JobsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobsService = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("bullmq");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const mentorship_request_schema_1 = require("../database/schemas/mentorship-request.schema");
const action_item_schema_1 = require("../database/schemas/action-item.schema");
const notification_schema_1 = require("../database/schemas/notification.schema");
const mentorship_schema_1 = require("../database/schemas/mentorship.schema");
const session_schema_1 = require("../database/schemas/session.schema");
const goal_schema_1 = require("../database/schemas/goal.schema");
const engagement_log_schema_1 = require("../database/schemas/engagement-log.schema");
const message_schema_1 = require("../database/schemas/message.schema");
const conversation_schema_1 = require("../database/schemas/conversation.schema");
const matching_service_1 = require("../matching/matching.service");
const email_service_1 = require("../email/email.service");
let JobsService = JobsService_1 = class JobsService {
    constructor(requestModel, actionItemModel, notificationModel, mentorshipModel, sessionModel, goalModel, engagementLogModel, messageModel, conversationModel, matchingService, emailService) {
        this.requestModel = requestModel;
        this.actionItemModel = actionItemModel;
        this.notificationModel = notificationModel;
        this.mentorshipModel = mentorshipModel;
        this.sessionModel = sessionModel;
        this.goalModel = goalModel;
        this.engagementLogModel = engagementLogModel;
        this.messageModel = messageModel;
        this.conversationModel = conversationModel;
        this.matchingService = matchingService;
        this.emailService = emailService;
        this.logger = new common_1.Logger(JobsService_1.name);
    }
    async onModuleInit() {
        const connection = {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379', 10),
        };
        if (process.env.REDIS_URL) {
            try {
                const parsed = new URL(process.env.REDIS_URL);
                connection.host = parsed.hostname;
                connection.port = parseInt(parsed.port || '6379', 10);
                if (parsed.password) {
                    connection.password = decodeURIComponent(parsed.password);
                }
                if (parsed.username) {
                    connection.username = parsed.username;
                }
                if (process.env.REDIS_URL.startsWith('rediss://')) {
                    connection.tls = { rejectUnauthorized: false };
                }
            }
            catch (err) {
                this.logger.warn(`Failed to parse REDIS_URL: ${err.message}`);
            }
        }
        this.embeddingQueue = new bullmq_1.Queue('embeddings', { connection });
        this.emailQueue = new bullmq_1.Queue('emails', { connection });
        this.workerEmbedding = new bullmq_1.Worker('embeddings', async (job) => {
            try {
                const { type, profileId } = job.data;
                this.logger.log(`Processing embedding job for ${type} profile: ${profileId}`);
                if (type === 'student') {
                    await this.matchingService.generateAndSaveStudentEmbedding(profileId);
                }
                else if (type === 'mentor') {
                    await this.matchingService.generateAndSaveMentorEmbedding(profileId);
                }
            }
            catch (err) {
                this.logger.error(`Error in embedding worker: ${err.message}`);
                throw err;
            }
        }, { connection, concurrency: 2 });
        this.workerEmail = new bullmq_1.Worker('emails', async (job) => {
            try {
                const { userId, type, title, message } = job.data;
                this.logger.log(`Processing email job for user ${userId}: ${title}`);
                await this.emailService.sendNotificationEmail(userId, type, title, message);
            }
            catch (err) {
                this.logger.error(`Error in email worker: ${err.message}`);
                throw err;
            }
        }, { connection, concurrency: 3 });
        this.intervalId = setInterval(async () => {
            await this.checkRequestExpirations();
            await this.checkOverdueActionItems();
            await this.runEngagementEvaluations();
        }, 60000);
    }
    async onModuleDestroy() {
        if (this.workerEmbedding)
            await this.workerEmbedding.close();
        if (this.workerEmail)
            await this.workerEmail.close();
        if (this.intervalId)
            clearInterval(this.intervalId);
    }
    async queueStudentEmbedding(studentProfileId) {
        if (this.embeddingQueue) {
            await this.embeddingQueue.add('student-embedding', { type: 'student', profileId: studentProfileId }, { attempts: 3, backoff: { type: 'exponential', delay: 10000 } });
        }
    }
    async queueMentorEmbedding(mentorProfileId) {
        if (this.embeddingQueue) {
            await this.embeddingQueue.add('mentor-embedding', { type: 'mentor', profileId: mentorProfileId }, { attempts: 3, backoff: { type: 'exponential', delay: 10000 } });
        }
    }
    async queueEmail(userId, type, title, message) {
        if (this.emailQueue) {
            await this.emailQueue.add('send-email', { userId, type, title, message }, { attempts: 5, backoff: { type: 'exponential', delay: 5000 } });
        }
    }
    async checkRequestExpirations() {
        try {
            const expirationThreshold = new Date();
            expirationThreshold.setHours(expirationThreshold.getHours() - 72);
            const expiredRequests = await this.requestModel.find({
                status: mentorship_request_schema_1.RequestStatus.PENDING,
                createdAt: { $lt: expirationThreshold },
            }).lean();
            if (expiredRequests.length === 0)
                return;
            this.logger.log(`Found ${expiredRequests.length} expired mentorship requests`);
            for (const req of expiredRequests) {
                await this.requestModel.findByIdAndUpdate(req._id, {
                    $set: { status: mentorship_request_schema_1.RequestStatus.EXPIRED },
                });
                const notification = new this.notificationModel({
                    userId: req.studentId,
                    type: 'REQUEST_EXPIRED',
                    title: 'Mentorship Request Expired',
                    message: 'Your request for mentorship has expired as the mentor did not respond within 72 hours.',
                });
                await notification.save();
            }
        }
        catch (err) {
            this.logger.error(`Error in checkRequestExpirations: ${err.message}`);
        }
    }
    async checkOverdueActionItems() {
        try {
            const now = new Date();
            const overdueItems = await this.actionItemModel.find({
                status: { $in: [action_item_schema_1.ActionItemStatus.PENDING, action_item_schema_1.ActionItemStatus.IN_PROGRESS] },
                dueDate: { $lt: now },
            }).lean();
            if (overdueItems.length === 0)
                return;
            this.logger.log(`Found ${overdueItems.length} overdue action items`);
            for (const item of overdueItems) {
                await this.actionItemModel.findByIdAndUpdate(item._id, {
                    $set: { status: action_item_schema_1.ActionItemStatus.OVERDUE },
                });
                const notification = new this.notificationModel({
                    userId: item.assignedToId,
                    type: 'ACTION_ITEM_OVERDUE',
                    title: 'Action Item Overdue',
                    message: `Your action item "${item.task}" is overdue. Please update your progress.`,
                });
                await notification.save();
            }
        }
        catch (err) {
            this.logger.error(`Error in checkOverdueActionItems: ${err.message}`);
        }
    }
    async runEngagementEvaluations() {
        try {
            const mentorships = await this.mentorshipModel.find({ status: 'ACTIVE' }).lean();
            const now = new Date();
            for (const m of mentorships) {
                const mId = m._id;
                const sessions = await this.sessionModel.find({ mentorshipId: mId }).lean();
                const goals = await this.goalModel.find({ mentorshipId: mId }).lean();
                const actionItems = await this.actionItemModel.find({ mentorshipId: mId }).lean();
                const conversation = await this.conversationModel.findOne({ mentorshipId: mId }).lean();
                let latestMessage = null;
                if (conversation) {
                    latestMessage = await this.messageModel
                        .findOne({ conversationId: conversation._id })
                        .sort({ createdAt: -1 })
                        .lean();
                }
                let lastInteractionDate = m.startDate || new Date();
                if (sessions.length > 0) {
                    const sortedSessions = [...sessions].sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
                    if (sortedSessions[0].startTime > lastInteractionDate) {
                        lastInteractionDate = sortedSessions[0].startTime;
                    }
                }
                if (latestMessage && latestMessage.createdAt > lastInteractionDate) {
                    lastInteractionDate = latestMessage.createdAt;
                }
                const daysSinceLastInteraction = Math.floor((now.getTime() - lastInteractionDate.getTime()) / (1000 * 60 * 60 * 24));
                let riskLevel = engagement_log_schema_1.RiskLevel.HEALTHY;
                let riskScore = 0.0;
                const reasons = [];
                if (daysSinceLastInteraction >= 30) {
                    riskLevel = engagement_log_schema_1.RiskLevel.INACTIVE;
                    riskScore = 1.0;
                    reasons.push('No interaction for 30+ days');
                }
                else if (daysSinceLastInteraction >= 21) {
                    riskLevel = engagement_log_schema_1.RiskLevel.AT_RISK;
                    riskScore = 0.8;
                    reasons.push('No interaction for 21+ days');
                }
                else if (daysSinceLastInteraction >= 14) {
                    riskLevel = engagement_log_schema_1.RiskLevel.NEEDS_ATTENTION;
                    riskScore = 0.5;
                    reasons.push('No interaction for 14+ days');
                }
                const overdueCount = actionItems.filter((item) => item.status === action_item_schema_1.ActionItemStatus.OVERDUE).length;
                if (overdueCount > 0) {
                    riskScore += overdueCount * 0.1;
                    reasons.push(`${overdueCount} overdue action item(s)`);
                }
                riskScore = Math.min(riskScore, 1.0);
                if (riskScore >= 0.7 && riskLevel !== engagement_log_schema_1.RiskLevel.INACTIVE) {
                    riskLevel = engagement_log_schema_1.RiskLevel.AT_RISK;
                }
                else if (riskScore >= 0.4 && riskLevel === engagement_log_schema_1.RiskLevel.HEALTHY) {
                    riskLevel = engagement_log_schema_1.RiskLevel.NEEDS_ATTENTION;
                }
                const logData = {
                    mentorshipId: mId,
                    lastInteractionDate,
                    sessionsCompletedCount: sessions.filter((s) => s.status === session_schema_1.SessionStatus.COMPLETED).length,
                    sessionsMissedCount: sessions.filter((s) => s.status === session_schema_1.SessionStatus.NO_SHOW).length,
                    goalsCompletedCount: goals.filter((g) => g.status === goal_schema_1.GoalStatus.COMPLETED).length,
                    actionItemsCompletedCount: actionItems.filter((a) => a.status === action_item_schema_1.ActionItemStatus.COMPLETED).length,
                    daysSinceLastInteraction,
                    riskScore,
                    riskLevel,
                    reasons,
                };
                await this.engagementLogModel.findOneAndUpdate({ mentorshipId: mId }, { $set: logData }, { upsert: true, new: true });
            }
        }
        catch (err) {
            this.logger.error(`Error in runEngagementEvaluations: ${err.message}`);
        }
    }
};
exports.JobsService = JobsService;
exports.JobsService = JobsService = JobsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(mentorship_request_schema_1.MentorshipRequest.name)),
    __param(1, (0, mongoose_1.InjectModel)(action_item_schema_1.ActionItem.name)),
    __param(2, (0, mongoose_1.InjectModel)(notification_schema_1.Notification.name)),
    __param(3, (0, mongoose_1.InjectModel)(mentorship_schema_1.Mentorship.name)),
    __param(4, (0, mongoose_1.InjectModel)(session_schema_1.Session.name)),
    __param(5, (0, mongoose_1.InjectModel)(goal_schema_1.Goal.name)),
    __param(6, (0, mongoose_1.InjectModel)(engagement_log_schema_1.EngagementLog.name)),
    __param(7, (0, mongoose_1.InjectModel)(message_schema_1.Message.name)),
    __param(8, (0, mongoose_1.InjectModel)(conversation_schema_1.Conversation.name)),
    __param(9, (0, common_1.Inject)((0, common_1.forwardRef)(() => matching_service_1.MatchingService))),
    __param(10, (0, common_1.Inject)((0, common_1.forwardRef)(() => email_service_1.EmailService))),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        matching_service_1.MatchingService,
        email_service_1.EmailService])
], JobsService);
//# sourceMappingURL=jobs.service.js.map
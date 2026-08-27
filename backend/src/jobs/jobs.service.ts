import { Injectable, OnModuleInit, OnModuleDestroy, Inject, forwardRef, Logger } from '@nestjs/common';
import { Queue, Worker, Job } from 'bullmq';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MentorshipRequest, MentorshipRequestDocument, RequestStatus } from '../database/schemas/mentorship-request.schema';
import { ActionItem, ActionItemDocument, ActionItemStatus } from '../database/schemas/action-item.schema';
import { Notification, NotificationDocument } from '../database/schemas/notification.schema';
import { Mentorship, MentorshipDocument } from '../database/schemas/mentorship.schema';
import { Session, SessionDocument, SessionStatus } from '../database/schemas/session.schema';
import { Goal, GoalDocument, GoalStatus } from '../database/schemas/goal.schema';
import { EngagementLog, EngagementLogDocument, RiskLevel } from '../database/schemas/engagement-log.schema';
import { Message, MessageDocument } from '../database/schemas/message.schema';
import { Conversation, ConversationDocument } from '../database/schemas/conversation.schema';
import { MatchingService } from '../matching/matching.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class JobsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(JobsService.name);
  private embeddingQueue: Queue;
  private emailQueue: Queue;
  private workerEmbedding: Worker;
  private workerEmail: Worker;
  private intervalId: NodeJS.Timeout;

  constructor(
    @InjectModel(MentorshipRequest.name)
    private readonly requestModel: Model<MentorshipRequestDocument>,
    @InjectModel(ActionItem.name)
    private readonly actionItemModel: Model<ActionItemDocument>,
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(Mentorship.name)
    private readonly mentorshipModel: Model<MentorshipDocument>,
    @InjectModel(Session.name)
    private readonly sessionModel: Model<SessionDocument>,
    @InjectModel(Goal.name)
    private readonly goalModel: Model<GoalDocument>,
    @InjectModel(EngagementLog.name)
    private readonly engagementLogModel: Model<EngagementLogDocument>,
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<ConversationDocument>,
    @Inject(forwardRef(() => MatchingService))
    private readonly matchingService: MatchingService,
    @Inject(forwardRef(() => EmailService))
    private readonly emailService: EmailService,
  ) {}

  async onModuleInit() {
    const connection: any = {
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
      } catch (err) {
        this.logger.warn(`Failed to parse REDIS_URL: ${err.message}`);
      }
    }

    // Instantiate Queues
    this.embeddingQueue = new Queue('embeddings', { connection });
    this.emailQueue = new Queue('emails', { connection });

    // Instantiate Workers
    this.workerEmbedding = new Worker(
      'embeddings',
      async (job: Job) => {
        try {
          const { type, profileId } = job.data;
          this.logger.log(`Processing embedding job for ${type} profile: ${profileId}`);

          if (type === 'student') {
            await this.matchingService.generateAndSaveStudentEmbedding(profileId);
          } else if (type === 'mentor') {
            await this.matchingService.generateAndSaveMentorEmbedding(profileId);
          }
        } catch (err) {
          this.logger.error(`Error in embedding worker: ${err.message}`);
          throw err;
        }
      },
      { connection, concurrency: 2 },
    );

    this.workerEmail = new Worker(
      'emails',
      async (job: Job) => {
        try {
          const { userId, type, title, message } = job.data;
          this.logger.log(`Processing email job for user ${userId}: ${title}`);
          await this.emailService.sendNotificationEmail(userId, type, title, message);
        } catch (err) {
          this.logger.error(`Error in email worker: ${err.message}`);
          throw err;
        }
      },
      { connection, concurrency: 3 },
    );

    // Periodic sweep every 1 minute
    this.intervalId = setInterval(async () => {
      await this.checkRequestExpirations();
      await this.checkOverdueActionItems();
      await this.runEngagementEvaluations();
    }, 60000);
  }

  async onModuleDestroy() {
    if (this.workerEmbedding) await this.workerEmbedding.close();
    if (this.workerEmail) await this.workerEmail.close();
    if (this.intervalId) clearInterval(this.intervalId);
  }

  // Enqueue Functions
  async queueStudentEmbedding(studentProfileId: string) {
    if (this.embeddingQueue) {
      await this.embeddingQueue.add(
        'student-embedding',
        { type: 'student', profileId: studentProfileId },
        { attempts: 3, backoff: { type: 'exponential', delay: 10000 } },
      );
    }
  }

  async queueMentorEmbedding(mentorProfileId: string) {
    if (this.embeddingQueue) {
      await this.embeddingQueue.add(
        'mentor-embedding',
        { type: 'mentor', profileId: mentorProfileId },
        { attempts: 3, backoff: { type: 'exponential', delay: 10000 } },
      );
    }
  }

  async queueEmail(userId: string, type: string, title: string, message: string) {
    if (this.emailQueue) {
      await this.emailQueue.add(
        'send-email',
        { userId, type, title, message },
        { attempts: 5, backoff: { type: 'exponential', delay: 5000 } },
      );
    }
  }

  // Sweep implementations
  private async checkRequestExpirations() {
    try {
      const expirationThreshold = new Date();
      expirationThreshold.setHours(expirationThreshold.getHours() - 72);

      const expiredRequests = await this.requestModel.find({
        status: RequestStatus.PENDING,
        createdAt: { $lt: expirationThreshold },
      }).lean();

      if (expiredRequests.length === 0) return;

      this.logger.log(`Found ${expiredRequests.length} expired mentorship requests`);

      for (const req of expiredRequests) {
        await this.requestModel.findByIdAndUpdate(req._id, {
          $set: { status: RequestStatus.EXPIRED },
        });

        // Notify Student
        const notification = new this.notificationModel({
          userId: req.studentId,
          type: 'REQUEST_EXPIRED',
          title: 'Mentorship Request Expired',
          message: 'Your request for mentorship has expired as the mentor did not respond within 72 hours.',
        });
        await notification.save();
      }
    } catch (err) {
      this.logger.error(`Error in checkRequestExpirations: ${err.message}`);
    }
  }

  private async checkOverdueActionItems() {
    try {
      const now = new Date();

      const overdueItems = await this.actionItemModel.find({
        status: { $in: [ActionItemStatus.PENDING, ActionItemStatus.IN_PROGRESS] },
        dueDate: { $lt: now },
      }).lean();

      if (overdueItems.length === 0) return;

      this.logger.log(`Found ${overdueItems.length} overdue action items`);

      for (const item of overdueItems) {
        await this.actionItemModel.findByIdAndUpdate(item._id, {
          $set: { status: ActionItemStatus.OVERDUE },
        });

        // Notify Assignee
        const notification = new this.notificationModel({
          userId: item.assignedToId,
          type: 'ACTION_ITEM_OVERDUE',
          title: 'Action Item Overdue',
          message: `Your action item "${item.task}" is overdue. Please update your progress.`,
        });
        await notification.save();
      }
    } catch (err) {
      this.logger.error(`Error in checkOverdueActionItems: ${err.message}`);
    }
  }

  private async runEngagementEvaluations() {
    try {
      const mentorships = await this.mentorshipModel.find({ status: 'ACTIVE' }).lean();
      const now = new Date();

      for (const m of mentorships) {
        const mId = m._id;

        // Fetch children
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
          const sortedSessions = [...sessions].sort(
            (a, b) => b.startTime.getTime() - a.startTime.getTime(),
          );
          if (sortedSessions[0].startTime > lastInteractionDate) {
            lastInteractionDate = sortedSessions[0].startTime;
          }
        }

        if (latestMessage && (latestMessage as any).createdAt > lastInteractionDate) {
          lastInteractionDate = (latestMessage as any).createdAt;
        }

        const daysSinceLastInteraction = Math.floor(
          (now.getTime() - lastInteractionDate.getTime()) / (1000 * 60 * 60 * 24),
        );

        let riskLevel = RiskLevel.HEALTHY;
        let riskScore = 0.0;
        const reasons: string[] = [];

        if (daysSinceLastInteraction >= 30) {
          riskLevel = RiskLevel.INACTIVE;
          riskScore = 1.0;
          reasons.push('No interaction for 30+ days');
        } else if (daysSinceLastInteraction >= 21) {
          riskLevel = RiskLevel.AT_RISK;
          riskScore = 0.8;
          reasons.push('No interaction for 21+ days');
        } else if (daysSinceLastInteraction >= 14) {
          riskLevel = RiskLevel.NEEDS_ATTENTION;
          riskScore = 0.5;
          reasons.push('No interaction for 14+ days');
        }

        const overdueCount = actionItems.filter((item) => item.status === ActionItemStatus.OVERDUE).length;
        if (overdueCount > 0) {
          riskScore += overdueCount * 0.1;
          reasons.push(`${overdueCount} overdue action item(s)`);
        }

        riskScore = Math.min(riskScore, 1.0);
        if (riskScore >= 0.7 && riskLevel !== RiskLevel.INACTIVE) {
          riskLevel = RiskLevel.AT_RISK;
        } else if (riskScore >= 0.4 && riskLevel === RiskLevel.HEALTHY) {
          riskLevel = RiskLevel.NEEDS_ATTENTION;
        }

        const logData = {
          mentorshipId: mId,
          lastInteractionDate,
          sessionsCompletedCount: sessions.filter((s) => s.status === SessionStatus.COMPLETED).length,
          sessionsMissedCount: sessions.filter((s) => s.status === SessionStatus.NO_SHOW).length,
          goalsCompletedCount: goals.filter((g) => g.status === GoalStatus.COMPLETED).length,
          actionItemsCompletedCount: actionItems.filter((a) => a.status === ActionItemStatus.COMPLETED).length,
          daysSinceLastInteraction,
          riskScore,
          riskLevel,
          reasons,
        };

        await this.engagementLogModel.findOneAndUpdate(
          { mentorshipId: mId },
          { $set: logData },
          { upsert: true, new: true },
        );
      }
    } catch (err) {
      this.logger.error(`Error in runEngagementEvaluations: ${err.message}`);
    }
  }
}

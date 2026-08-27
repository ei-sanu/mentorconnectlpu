import { Injectable, NotFoundException, Inject, forwardRef, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CalendarIntegration, CalendarIntegrationDocument } from '../database/schemas/calendar-integration.schema';
import { Session, SessionDocument, SessionStatus, CalendarSyncStatus } from '../database/schemas/session.schema';
import { SessionsService } from '../sessions/sessions.service';
import { google } from 'googleapis';
import * as crypto from 'crypto';

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);
  private readonly algorithm = 'aes-256-cbc';
  private readonly key: Buffer;

  constructor(
    @InjectModel(CalendarIntegration.name)
    private readonly integrationModel: Model<CalendarIntegrationDocument>,
    @InjectModel(Session.name)
    private readonly sessionModel: Model<SessionDocument>,
    @Inject(forwardRef(() => SessionsService))
    private readonly sessionsService: SessionsService,
  ) {
    const secret = process.env.TOKEN_ENCRYPTION_KEY || 'default-encryption-secret-key-32ch';
    this.key = crypto.scryptSync(secret, 'salt', 32);
  }

  // Encrypt utility
  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }

  // Decrypt utility
  private decrypt(text: string): string {
    const parts = text.split(':');
    const iv = Buffer.from(parts.shift() || '', 'hex');
    const encryptedText = Buffer.from(parts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    const decrypted = Buffer.concat([
      decipher.update(encryptedText),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  }

  async saveGoogleCredentials(userId: string, code: string) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );

    const { tokens } = await oauth2Client.getToken(code);
    const expiryDate = new Date(tokens.expiry_date || Date.now() + 3600 * 1000);

    const accessTokenEnc = this.encrypt(tokens.access_token || '');
    const refreshTokenEnc = this.encrypt(tokens.refresh_token || '');

    const userIdObj = new Types.ObjectId(userId);

    await this.integrationModel.findOneAndUpdate(
      { userId: userIdObj, provider: 'GOOGLE' },
      {
        $set: {
          accessToken: accessTokenEnc,
          refreshToken: refreshTokenEnc,
          expiryDate,
          scopes: tokens.scope ? tokens.scope.split(' ') : [],
        },
      },
      { upsert: true, new: true },
    );

    return { success: true, message: 'Google Calendar connected successfully.' };
  }

  async syncSessionEvent(sessionId: string) {
    const session = await this.sessionModel
      .findById(sessionId)
      .populate({
        path: 'mentorshipId',
        populate: [
          { path: 'studentProfileId', populate: { path: 'userId' } },
          { path: 'mentorProfileId', populate: { path: 'userId' } },
        ],
      })
      .lean();

    if (!session) return;

    // Find if creator has Google/Microsoft calendar integration
    const integration = await this.integrationModel.findOne({
      userId: new Types.ObjectId(session.createdBy),
    });

    if (!integration) {
      await this.sessionModel.findByIdAndUpdate(sessionId, {
        $set: { calendarSyncStatus: CalendarSyncStatus.SYNCED },
      });
      return;
    }

    try {
      if (integration.provider === 'GOOGLE') {
        await this.syncToGoogle(session, integration);
      } else if (integration.provider === 'MICROSOFT') {
        await this.syncToMicrosoft(session, integration);
      }
    } catch (err) {
      this.logger.error(`Failed to sync calendar event for session ${sessionId}: ${err.message}`);
      await this.sessionModel.findByIdAndUpdate(sessionId, {
        $set: { calendarSyncStatus: CalendarSyncStatus.FAILED },
      });
    }
  }

  private async syncToGoogle(session: any, integration: any) {
    const accessToken = this.decrypt(integration.accessToken);
    const refreshToken = this.decrypt(integration.refreshToken);

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
      expiry_date: integration.expiryDate.getTime(),
    });

    // Handle token refresh
    if (integration.expiryDate.getTime() < Date.now()) {
      const { credentials } = await oauth2Client.refreshAccessToken();
      const newExpiry = new Date(credentials.expiry_date || Date.now() + 3600 * 1000);
      await this.integrationModel.findByIdAndUpdate(integration._id, {
        $set: {
          accessToken: this.encrypt(credentials.access_token || ''),
          expiryDate: newExpiry,
        },
      });
    }

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const eventBody: any = {
      summary: session.title,
      description: session.notes || 'Mentorship session scheduled via LPU MentorConnect',
      start: {
        dateTime: session.startTime.toISOString(),
        timeZone: session.timezone,
      },
      end: {
        dateTime: session.endTime.toISOString(),
        timeZone: session.timezone,
      },
      attendees: [
        { email: session.mentorshipId.studentProfileId.userId.email },
        { email: session.mentorshipId.mentorProfileId.userId.email },
      ],
      conferenceData: {
        createRequest: {
          requestId: `session-${session._id.toString()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    };

    if (session.calendarEventId) {
      if (session.status === SessionStatus.CANCELLED) {
        await calendar.events.delete({
          calendarId: 'primary',
          eventId: session.calendarEventId,
        });
      } else {
        await calendar.events.update({
          calendarId: 'primary',
          eventId: session.calendarEventId,
          requestBody: eventBody,
        });
      }
    } else {
      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: eventBody,
        conferenceDataVersion: 1,
      });

      const meetingUrl = response.data.hangoutLink || session.meetingUrl;

      await this.sessionModel.findByIdAndUpdate(session._id, {
        $set: {
          calendarEventId: response.data.id || undefined,
          meetingUrl,
          calendarSyncStatus: CalendarSyncStatus.SYNCED,
        },
      });
    }
  }

  private async syncToMicrosoft(session: any, integration: any) {
    this.logger.log(`Mocking Microsoft Outlook Calendar Sync for session: ${session.title}`);
    await this.sessionModel.findByIdAndUpdate(session._id, {
      $set: {
        calendarEventId: `ms-event-${session._id.toString()}`,
        calendarSyncStatus: CalendarSyncStatus.SYNCED,
      },
    });
  }

  async disconnect(userId: string) {
    await this.integrationModel.deleteMany({ userId: new Types.ObjectId(userId) });
    return { success: true, message: 'Calendar disconnected.' };
  }
}

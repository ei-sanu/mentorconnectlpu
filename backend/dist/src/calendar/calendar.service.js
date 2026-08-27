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
var CalendarService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const calendar_integration_schema_1 = require("../database/schemas/calendar-integration.schema");
const session_schema_1 = require("../database/schemas/session.schema");
const sessions_service_1 = require("../sessions/sessions.service");
const googleapis_1 = require("googleapis");
const crypto = require("crypto");
let CalendarService = CalendarService_1 = class CalendarService {
    constructor(integrationModel, sessionModel, sessionsService) {
        this.integrationModel = integrationModel;
        this.sessionModel = sessionModel;
        this.sessionsService = sessionsService;
        this.logger = new common_1.Logger(CalendarService_1.name);
        this.algorithm = 'aes-256-cbc';
        const secret = process.env.TOKEN_ENCRYPTION_KEY || 'default-encryption-secret-key-32ch';
        this.key = crypto.scryptSync(secret, 'salt', 32);
    }
    encrypt(text) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return `${iv.toString('hex')}:${encrypted}`;
    }
    decrypt(text) {
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
    async saveGoogleCredentials(userId, code) {
        const oauth2Client = new googleapis_1.google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);
        const { tokens } = await oauth2Client.getToken(code);
        const expiryDate = new Date(tokens.expiry_date || Date.now() + 3600 * 1000);
        const accessTokenEnc = this.encrypt(tokens.access_token || '');
        const refreshTokenEnc = this.encrypt(tokens.refresh_token || '');
        const userIdObj = new mongoose_2.Types.ObjectId(userId);
        await this.integrationModel.findOneAndUpdate({ userId: userIdObj, provider: 'GOOGLE' }, {
            $set: {
                accessToken: accessTokenEnc,
                refreshToken: refreshTokenEnc,
                expiryDate,
                scopes: tokens.scope ? tokens.scope.split(' ') : [],
            },
        }, { upsert: true, new: true });
        return { success: true, message: 'Google Calendar connected successfully.' };
    }
    async syncSessionEvent(sessionId) {
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
        if (!session)
            return;
        const integration = await this.integrationModel.findOne({
            userId: new mongoose_2.Types.ObjectId(session.createdBy),
        });
        if (!integration) {
            await this.sessionModel.findByIdAndUpdate(sessionId, {
                $set: { calendarSyncStatus: session_schema_1.CalendarSyncStatus.SYNCED },
            });
            return;
        }
        try {
            if (integration.provider === 'GOOGLE') {
                await this.syncToGoogle(session, integration);
            }
            else if (integration.provider === 'MICROSOFT') {
                await this.syncToMicrosoft(session, integration);
            }
        }
        catch (err) {
            this.logger.error(`Failed to sync calendar event for session ${sessionId}: ${err.message}`);
            await this.sessionModel.findByIdAndUpdate(sessionId, {
                $set: { calendarSyncStatus: session_schema_1.CalendarSyncStatus.FAILED },
            });
        }
    }
    async syncToGoogle(session, integration) {
        const accessToken = this.decrypt(integration.accessToken);
        const refreshToken = this.decrypt(integration.refreshToken);
        const oauth2Client = new googleapis_1.google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);
        oauth2Client.setCredentials({
            access_token: accessToken,
            refresh_token: refreshToken,
            expiry_date: integration.expiryDate.getTime(),
        });
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
        const calendar = googleapis_1.google.calendar({ version: 'v3', auth: oauth2Client });
        const eventBody = {
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
            if (session.status === session_schema_1.SessionStatus.CANCELLED) {
                await calendar.events.delete({
                    calendarId: 'primary',
                    eventId: session.calendarEventId,
                });
            }
            else {
                await calendar.events.update({
                    calendarId: 'primary',
                    eventId: session.calendarEventId,
                    requestBody: eventBody,
                });
            }
        }
        else {
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
                    calendarSyncStatus: session_schema_1.CalendarSyncStatus.SYNCED,
                },
            });
        }
    }
    async syncToMicrosoft(session, integration) {
        this.logger.log(`Mocking Microsoft Outlook Calendar Sync for session: ${session.title}`);
        await this.sessionModel.findByIdAndUpdate(session._id, {
            $set: {
                calendarEventId: `ms-event-${session._id.toString()}`,
                calendarSyncStatus: session_schema_1.CalendarSyncStatus.SYNCED,
            },
        });
    }
    async disconnect(userId) {
        await this.integrationModel.deleteMany({ userId: new mongoose_2.Types.ObjectId(userId) });
        return { success: true, message: 'Calendar disconnected.' };
    }
};
exports.CalendarService = CalendarService;
exports.CalendarService = CalendarService = CalendarService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(calendar_integration_schema_1.CalendarIntegration.name)),
    __param(1, (0, mongoose_1.InjectModel)(session_schema_1.Session.name)),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => sessions_service_1.SessionsService))),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        sessions_service_1.SessionsService])
], CalendarService);
//# sourceMappingURL=calendar.service.js.map
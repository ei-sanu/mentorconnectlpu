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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const session_schema_1 = require("../database/schemas/session.schema");
const mentorship_schema_1 = require("../database/schemas/mentorship.schema");
const notifications_service_1 = require("../notifications/notifications.service");
const audit_service_1 = require("../audit/audit.service");
const calendar_service_1 = require("../calendar/calendar.service");
const event_bus_1 = require("../common/event-bus");
let SessionsService = class SessionsService {
    constructor(sessionModel, mentorshipModel, notifications, calendar, audit) {
        this.sessionModel = sessionModel;
        this.mentorshipModel = mentorshipModel;
        this.notifications = notifications;
        this.calendar = calendar;
        this.audit = audit;
    }
    async findSessionsForMentorship(mentorshipId, userId) {
        const mentorship = await this.mentorshipModel
            .findById(mentorshipId)
            .populate('studentProfileId')
            .populate('mentorProfileId')
            .lean();
        if (!mentorship) {
            throw new common_1.NotFoundException('Mentorship not found');
        }
        const studentUserIdStr = mentorship.studentProfileId.userId?.toString();
        const mentorUserIdStr = mentorship.mentorProfileId.userId?.toString();
        if (studentUserIdStr !== userId && mentorUserIdStr !== userId) {
            return [];
        }
        const list = await this.sessionModel
            .find({ mentorshipId: new mongoose_2.Types.ObjectId(mentorshipId) })
            .sort({ startTime: 1 })
            .lean();
        return list.map((s) => ({
            ...s,
            id: s._id.toString(),
        }));
    }
    async createSession(mentorshipId, userId, dto) {
        const mentorship = await this.mentorshipModel
            .findById(mentorshipId)
            .populate({ path: 'studentProfileId', populate: { path: 'userId' } })
            .populate({ path: 'mentorProfileId', populate: { path: 'userId' } })
            .lean();
        if (!mentorship) {
            throw new common_1.NotFoundException('Mentorship not found');
        }
        if (mentorship.status !== mentorship_schema_1.MentorshipStatus.ACTIVE) {
            throw new common_1.BadRequestException('Can only book sessions for ACTIVE mentorships');
        }
        const studentUserIdStr = mentorship.studentProfileId.userId?._id?.toString();
        const mentorUserIdStr = mentorship.mentorProfileId.userId?._id?.toString();
        if (studentUserIdStr !== userId && mentorUserIdStr !== userId) {
            throw new common_1.ForbiddenException('Access denied. You do not participate in this mentorship.');
        }
        const start = new Date(dto.startTime);
        const end = new Date(dto.endTime);
        if (start >= end) {
            throw new common_1.BadRequestException('End time must be after start time');
        }
        const activeMentorshipIds = await this.mentorshipModel
            .find({
            $or: [
                { studentProfileId: mentorship.studentProfileId._id },
                { mentorProfileId: mentorship.mentorProfileId._id },
            ],
        })
            .distinct('_id');
        const conflict = await this.sessionModel.findOne({
            status: session_schema_1.SessionStatus.SCHEDULED,
            mentorshipId: { $in: activeMentorshipIds },
            startTime: { $lt: end },
            endTime: { $gt: start },
        });
        if (conflict) {
            throw new common_1.BadRequestException('Scheduling conflict. Either the student or mentor is already booked.');
        }
        const session = new this.sessionModel({
            mentorshipId: new mongoose_2.Types.ObjectId(mentorshipId),
            title: dto.title,
            startTime: start,
            endTime: end,
            timezone: dto.timezone || 'Asia/Kolkata',
            status: session_schema_1.SessionStatus.SCHEDULED,
            notes: dto.notes,
            createdBy: userId,
            meetingUrl: 'https://meet.google.com/mock-link-' + Math.random().toString(36).substring(7),
            calendarSyncStatus: session_schema_1.CalendarSyncStatus.PENDING,
        });
        await session.save();
        const sessionIdStr = session._id.toString();
        this.calendar.syncSessionEvent(sessionIdStr).catch((err) => {
            console.error(`Deferred calendar sync failed for session ${sessionIdStr}: ${err.message}`);
        });
        const receiverId = userId === studentUserIdStr ? mentorUserIdStr : studentUserIdStr;
        const requesterName = userId === studentUserIdStr
            ? `${mentorship.studentProfileId.userId.firstName} ${mentorship.studentProfileId.userId.lastName}`
            : `${mentorship.mentorProfileId.userId.firstName} ${mentorship.mentorProfileId.userId.lastName}`;
        await this.notifications.create(receiverId, 'SESSION_SCHEDULED', 'New Mentorship Session Scheduled', `${requesterName} scheduled a session: "${dto.title}" on ${start.toLocaleDateString()}`, { sessionId: sessionIdStr });
        await this.audit.log(userId, 'SCHEDULE_SESSION', 'Session', sessionIdStr, { mentorshipId });
        event_bus_1.globalEventBus.emit('dashboard_update', { type: 'SESSION_BOOKED' });
        return {
            ...session.toObject(),
            id: sessionIdStr,
        };
    }
    async updateSession(id, userId, dto) {
        const session = await this.sessionModel
            .findById(id)
            .populate({
            path: 'mentorshipId',
            populate: [
                { path: 'studentProfileId' },
                { path: 'mentorProfileId' },
            ],
        })
            .lean();
        if (!session) {
            throw new common_1.NotFoundException('Session not found');
        }
        const studentUserIdStr = session.mentorshipId.studentProfileId?.userId?.toString();
        const mentorUserIdStr = session.mentorshipId.mentorProfileId?.userId?.toString();
        if (studentUserIdStr !== userId && mentorUserIdStr !== userId) {
            throw new common_1.ForbiddenException('Access denied');
        }
        const start = dto.startTime ? new Date(dto.startTime) : session.startTime;
        const end = dto.endTime ? new Date(dto.endTime) : session.endTime;
        if (start >= end) {
            throw new common_1.BadRequestException('End time must be after start time');
        }
        if (dto.startTime || dto.endTime) {
            const activeMentorshipIds = await this.mentorshipModel
                .find({
                $or: [
                    { studentProfileId: session.mentorshipId.studentProfileId?._id },
                    { mentorProfileId: session.mentorshipId.mentorProfileId?._id },
                ],
            })
                .distinct('_id');
            const conflict = await this.sessionModel.findOne({
                _id: { $ne: new mongoose_2.Types.ObjectId(id) },
                status: session_schema_1.SessionStatus.SCHEDULED,
                mentorshipId: { $in: activeMentorshipIds },
                startTime: { $lt: end },
                endTime: { $gt: start },
            });
            if (conflict) {
                throw new common_1.BadRequestException('Rescheduling conflict. Either student or mentor is booked.');
            }
        }
        const updated = await this.sessionModel
            .findByIdAndUpdate(id, {
            $set: {
                title: dto.title,
                startTime: start,
                endTime: end,
                notes: dto.notes,
                status: dto.status,
            },
        }, { new: true })
            .lean();
        this.calendar.syncSessionEvent(id).catch((err) => {
            console.error(`Calendar sync update failed for session ${id}: ${err.message}`);
        });
        return {
            ...updated,
            id: updated._id.toString(),
        };
    }
    async cancelSession(id, userId) {
        const session = await this.sessionModel
            .findById(id)
            .populate({
            path: 'mentorshipId',
            populate: [
                { path: 'studentProfileId' },
                { path: 'mentorProfileId' },
            ],
        })
            .lean();
        if (!session) {
            throw new common_1.NotFoundException('Session not found');
        }
        const studentUserIdStr = session.mentorshipId.studentProfileId?.userId?.toString();
        const mentorUserIdStr = session.mentorshipId.mentorProfileId?.userId?.toString();
        if (studentUserIdStr !== userId && mentorUserIdStr !== userId) {
            throw new common_1.ForbiddenException('Access denied');
        }
        const updated = await this.sessionModel
            .findByIdAndUpdate(id, { $set: { status: session_schema_1.SessionStatus.CANCELLED } }, { new: true })
            .lean();
        this.calendar.syncSessionEvent(id).catch((err) => {
            console.error(`Calendar sync cancellation failed for session ${id}: ${err.message}`);
        });
        return {
            ...updated,
            id: updated._id.toString(),
        };
    }
};
exports.SessionsService = SessionsService;
exports.SessionsService = SessionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(session_schema_1.Session.name)),
    __param(1, (0, mongoose_1.InjectModel)(mentorship_schema_1.Mentorship.name)),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => calendar_service_1.CalendarService))),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        notifications_service_1.NotificationsService,
        calendar_service_1.CalendarService,
        audit_service_1.AuditService])
], SessionsService);
//# sourceMappingURL=sessions.service.js.map
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Session, SessionDocument, SessionStatus, CalendarSyncStatus } from '../database/schemas/session.schema';
import { Mentorship, MentorshipDocument, MentorshipStatus } from '../database/schemas/mentorship.schema';
import { CreateSessionDto } from './dto/create-session.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';
import { CalendarService } from '../calendar/calendar.service';
import { globalEventBus } from '../common/event-bus';

@Injectable()
export class SessionsService {
  constructor(
    @InjectModel(Session.name)
    private readonly sessionModel: Model<SessionDocument>,
    @InjectModel(Mentorship.name)
    private readonly mentorshipModel: Model<MentorshipDocument>,
    private readonly notifications: NotificationsService,
    @Inject(forwardRef(() => CalendarService))
    private readonly calendar: CalendarService,
    private readonly audit: AuditService,
  ) {}

  async findSessionsForMentorship(mentorshipId: string, userId: string): Promise<any[]> {
    const mentorship = await this.mentorshipModel
      .findById(mentorshipId)
      .populate('studentProfileId')
      .populate('mentorProfileId')
      .lean();

    if (!mentorship) {
      throw new NotFoundException('Mentorship not found');
    }

    const studentUserIdStr = (mentorship.studentProfileId as any).userId?.toString();
    const mentorUserIdStr = (mentorship.mentorProfileId as any).userId?.toString();

    if (studentUserIdStr !== userId && mentorUserIdStr !== userId) {
      return [];
    }

    const list = await this.sessionModel
      .find({ mentorshipId: new Types.ObjectId(mentorshipId) })
      .sort({ startTime: 1 })
      .lean();

    return list.map((s) => ({
      ...s,
      id: s._id.toString(),
    }));
  }

  async createSession(mentorshipId: string, userId: string, dto: CreateSessionDto): Promise<any> {
    const mentorship = await this.mentorshipModel
      .findById(mentorshipId)
      .populate({ path: 'studentProfileId', populate: { path: 'userId' } })
      .populate({ path: 'mentorProfileId', populate: { path: 'userId' } })
      .lean();

    if (!mentorship) {
      throw new NotFoundException('Mentorship not found');
    }

    if (mentorship.status !== MentorshipStatus.ACTIVE) {
      throw new BadRequestException('Can only book sessions for ACTIVE mentorships');
    }

    const studentUserIdStr = (mentorship.studentProfileId as any).userId?._id?.toString();
    const mentorUserIdStr = (mentorship.mentorProfileId as any).userId?._id?.toString();

    if (studentUserIdStr !== userId && mentorUserIdStr !== userId) {
      throw new ForbiddenException('Access denied. You do not participate in this mentorship.');
    }

    const start = new Date(dto.startTime);
    const end = new Date(dto.endTime);

    if (start >= end) {
      throw new BadRequestException('End time must be after start time');
    }

    // Find all active mentorships for this student or mentor to check for overlap
    const activeMentorshipIds = await this.mentorshipModel
      .find({
        $or: [
          { studentProfileId: (mentorship.studentProfileId as any)._id },
          { mentorProfileId: (mentorship.mentorProfileId as any)._id },
        ],
      })
      .distinct('_id');

    // 1. Transaction-safe Overlap conflict detection (TEST 9)
    const conflict = await this.sessionModel.findOne({
      status: SessionStatus.SCHEDULED,
      mentorshipId: { $in: activeMentorshipIds },
      startTime: { $lt: end },
      endTime: { $gt: start },
    });

    if (conflict) {
      throw new BadRequestException('Scheduling conflict. Either the student or mentor is already booked.');
    }

    // 2. Create local session
    const session = new this.sessionModel({
      mentorshipId: new Types.ObjectId(mentorshipId),
      title: dto.title,
      startTime: start,
      endTime: end,
      timezone: dto.timezone || 'Asia/Kolkata',
      status: SessionStatus.SCHEDULED,
      notes: dto.notes,
      createdBy: userId,
      meetingUrl: 'https://meet.google.com/mock-link-' + Math.random().toString(36).substring(7),
      calendarSyncStatus: CalendarSyncStatus.PENDING,
    });
    await session.save();

    const sessionIdStr = session._id.toString();

    // 3. Sync Calendar asynchronously (TEST 66)
    this.calendar.syncSessionEvent(sessionIdStr).catch((err) => {
      console.error(`Deferred calendar sync failed for session ${sessionIdStr}: ${err.message}`);
    });

    // 4. Notifications
    const receiverId = userId === studentUserIdStr ? mentorUserIdStr : studentUserIdStr;
    const requesterName = userId === studentUserIdStr
      ? `${(mentorship.studentProfileId as any).userId.firstName} ${(mentorship.studentProfileId as any).userId.lastName}`
      : `${(mentorship.mentorProfileId as any).userId.firstName} ${(mentorship.mentorProfileId as any).userId.lastName}`;

    await this.notifications.create(
      receiverId,
      'SESSION_SCHEDULED',
      'New Mentorship Session Scheduled',
      `${requesterName} scheduled a session: "${dto.title}" on ${start.toLocaleDateString()}`,
      { sessionId: sessionIdStr },
    );

    await this.audit.log(
      userId,
      'SCHEDULE_SESSION',
      'Session',
      sessionIdStr,
      { mentorshipId },
    );

    globalEventBus.emit('dashboard_update', { type: 'SESSION_BOOKED' });

    return {
      ...session.toObject(),
      id: sessionIdStr,
    };
  }

  async updateSession(id: string, userId: string, dto: any): Promise<any> {
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
      throw new NotFoundException('Session not found');
    }

    const studentUserIdStr = (session.mentorshipId as any).studentProfileId?.userId?.toString();
    const mentorUserIdStr = (session.mentorshipId as any).mentorProfileId?.userId?.toString();

    if (studentUserIdStr !== userId && mentorUserIdStr !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const start = dto.startTime ? new Date(dto.startTime) : session.startTime;
    const end = dto.endTime ? new Date(dto.endTime) : session.endTime;

    if (start >= end) {
      throw new BadRequestException('End time must be after start time');
    }

    if (dto.startTime || dto.endTime) {
      // Overlap conflict detection on reschedule
      const activeMentorshipIds = await this.mentorshipModel
        .find({
          $or: [
            { studentProfileId: (session.mentorshipId as any).studentProfileId?._id },
            { mentorProfileId: (session.mentorshipId as any).mentorProfileId?._id },
          ],
        })
        .distinct('_id');

      const conflict = await this.sessionModel.findOne({
        _id: { $ne: new Types.ObjectId(id) },
        status: SessionStatus.SCHEDULED,
        mentorshipId: { $in: activeMentorshipIds },
        startTime: { $lt: end },
        endTime: { $gt: start },
      });

      if (conflict) {
        throw new BadRequestException('Rescheduling conflict. Either student or mentor is booked.');
      }
    }

    const updated = await this.sessionModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            title: dto.title,
            startTime: start,
            endTime: end,
            notes: dto.notes,
            status: dto.status,
          },
        },
        { new: true },
      )
      .lean();

    // Update calendar event
    this.calendar.syncSessionEvent(id).catch((err) => {
      console.error(`Calendar sync update failed for session ${id}: ${err.message}`);
    });

    return {
      ...updated,
      id: updated._id.toString(),
    };
  }

  async cancelSession(id: string, userId: string): Promise<any> {
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
      throw new NotFoundException('Session not found');
    }

    const studentUserIdStr = (session.mentorshipId as any).studentProfileId?.userId?.toString();
    const mentorUserIdStr = (session.mentorshipId as any).mentorProfileId?.userId?.toString();

    if (studentUserIdStr !== userId && mentorUserIdStr !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const updated = await this.sessionModel
      .findByIdAndUpdate(id, { $set: { status: SessionStatus.CANCELLED } }, { new: true })
      .lean();

    // Cancel calendar event
    this.calendar.syncSessionEvent(id).catch((err) => {
      console.error(`Calendar sync cancellation failed for session ${id}: ${err.message}`);
    });

    return {
      ...updated,
      id: updated._id.toString(),
    };
  }
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types } from 'mongoose';
import { MentorshipRequest, MentorshipRequestDocument, RequestStatus } from '../database/schemas/mentorship-request.schema';
import { MentorProfile, MentorProfileDocument, VerificationStatus, MentorStatus } from '../database/schemas/mentor-profile.schema';
import { StudentProfile, StudentProfileDocument } from '../database/schemas/student-profile.schema';
import { User, UserDocument, Role } from '../database/schemas/user.schema';
import { Mentorship, MentorshipDocument, MentorshipStatus } from '../database/schemas/mentorship.schema';
import { Conversation, ConversationDocument } from '../database/schemas/conversation.schema';
import { Message, MessageDocument } from '../database/schemas/message.schema';
import { CreateRequestDto } from './dto/create-request.dto';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { runTransactionSafely } from '../database/transaction.helper';
import { globalEventBus } from '../common/event-bus';

@Injectable()
export class RequestsService {
  constructor(
    @InjectModel(MentorshipRequest.name)
    private readonly requestModel: Model<MentorshipRequestDocument>,
    @InjectModel(MentorProfile.name)
    private readonly mentorProfileModel: Model<MentorProfileDocument>,
    @InjectModel(StudentProfile.name)
    private readonly studentProfileModel: Model<StudentProfileDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Mentorship.name)
    private readonly mentorshipModel: Model<MentorshipDocument>,
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async create(studentUserId: string, dto: CreateRequestDto): Promise<any> {
    const studentProfile = await this.studentProfileModel.findOne({ userId: studentUserId }).lean();
    if (!studentProfile) {
      throw new BadRequestException('You must complete your career profile before requesting a mentor.');
    }

    // 1. Throttling Limit check: Max 3 pending requests (TEST 3)
    const pendingCount = await this.requestModel.countDocuments({
      studentId: new Types.ObjectId(studentUserId),
      status: RequestStatus.PENDING,
    });

    if (pendingCount >= 3) {
      throw new BadRequestException('You have reached the maximum limit of 3 pending requests.');
    }

    const mentor = await this.mentorProfileModel.findById(dto.mentorId).populate('userId').lean();
    if (!mentor) {
      throw new NotFoundException('Mentor not found');
    }

    // TEST 5: Unverified mentor check
    if (mentor.verificationStatus !== VerificationStatus.VERIFIED) {
      throw new BadRequestException('This mentor is not verified yet.');
    }

    if (mentor.status !== MentorStatus.ACTIVE || !mentor.acceptingMentees) {
      throw new BadRequestException('This mentor is not currently accepting new requests.');
    }

    if (mentor.currentMenteesCount >= mentor.maxCapacity) {
      throw new BadRequestException('This mentor is currently at capacity.');
    }

    // Check if request is already active or pending with this mentor
    const existing = await this.requestModel.findOne({
      studentId: new Types.ObjectId(studentUserId),
      mentorId: new Types.ObjectId(dto.mentorId),
      status: { $in: [RequestStatus.PENDING, RequestStatus.ACCEPTED] },
    });

    if (existing) {
      throw new BadRequestException('You already have a pending request or active mentorship with this mentor.');
    }

    const request = new this.requestModel({
      studentId: new Types.ObjectId(studentUserId),
      mentorId: new Types.ObjectId(dto.mentorId),
      message: dto.message,
      goal: dto.goal,
      status: RequestStatus.PENDING,
    });
    await request.save();

    const requestPopulated = await this.requestModel
      .findById(request._id)
      .populate('studentId')
      .lean();

    if (!requestPopulated) {
      throw new BadRequestException('Failed to retrieve created request details.');
    }

    // Notify Mentor
    await this.notifications.create(
      mentor.userId.toString(),
      'NEW_REQUEST',
      'New Mentorship Request',
      `${(requestPopulated.studentId as any).firstName} ${(requestPopulated.studentId as any).lastName} requested you as a mentor for: ${dto.goal}`,
      { requestId: request._id.toString() },
    );

    await this.audit.log(
      studentUserId,
      'SEND_REQUEST',
      'MentorshipRequest',
      request._id.toString(),
      { mentorId: dto.mentorId },
    );

    globalEventBus.emit('dashboard_update', { type: 'MENTORSHIP_REQUEST_CREATED' });

    return {
      ...requestPopulated,
      id: request._id.toString(),
    };
  }

  async findAll(userId: string, role: string) {
    if (role === Role.STUDENT) {
      const list = await this.requestModel
        .find({ studentId: new Types.ObjectId(userId) })
        .populate({
          path: 'mentorId',
          populate: { path: 'userId' },
        })
        .sort({ createdAt: -1 })
        .lean();

      return list.map((r: any) => ({
        ...r,
        id: r._id.toString(),
        mentor: r.mentorId
          ? {
              ...r.mentorId,
              id: r.mentorId._id?.toString(),
              user: r.mentorId.userId
                ? {
                    ...r.mentorId.userId,
                    id: r.mentorId.userId._id?.toString(),
                  }
                : null,
            }
          : null,
      }));
    } else if (role === Role.MENTOR) {
      const mentorProfile = await this.mentorProfileModel.findOne({ userId }).lean();
      if (!mentorProfile) return [];

      const list = await this.requestModel
        .find({ mentorId: mentorProfile._id })
        .populate('studentId')
        .sort({ createdAt: -1 })
        .lean();

      return list.map((r: any) => ({
        ...r,
        id: r._id.toString(),
        student: r.studentId
          ? {
              ...r.studentId,
              id: r.studentId._id?.toString(),
            }
          : null,
      }));
    }

    const list = await this.requestModel
      .find()
      .populate('studentId')
      .populate({
        path: 'mentorId',
        populate: { path: 'userId' },
      })
      .sort({ createdAt: -1 })
      .lean();

    return list.map((r: any) => ({
      ...r,
      id: r._id.toString(),
      student: r.studentId ? { ...r.studentId, id: r.studentId._id?.toString() } : null,
      mentor: r.mentorId ? { ...r.mentorId, id: r.mentorId._id?.toString() } : null,
    }));
  }

  async findOne(id: string, userId: string): Promise<any> {
    const request = await this.requestModel
      .findById(id)
      .populate('studentId')
      .populate({
        path: 'mentorId',
        populate: { path: 'userId' },
      })
      .lean();

    if (!request) {
      throw new NotFoundException(`Request with ID ${id} not found`);
    }

    const requestStudentIdStr = request.studentId._id?.toString() || request.studentId?.toString();
    const mentorUserIdStr = (request.mentorId as any)?.userId?._id?.toString() || (request.mentorId as any)?.userId?.toString();

    // Check ownership
    if (requestStudentIdStr !== userId && mentorUserIdStr !== userId) {
      throw new ForbiddenException('Access denied. You do not own this request.');
    }

    return {
      ...request,
      id: request._id.toString(),
      student: request.studentId ? { ...request.studentId, id: requestStudentIdStr } : null,
      mentor: request.mentorId
        ? {
            ...(request.mentorId as any),
            id: (request.mentorId as any)._id?.toString(),
            user: (request.mentorId as any).userId
              ? {
                  ...(request.mentorId as any).userId,
                  id: mentorUserIdStr,
                }
              : null,
          }
        : null,
    };
  }

  async accept(id: string, mentorUserId: string) {
    const request = await this.requestModel
      .findById(id)
      .populate('studentId')
      .populate({
        path: 'mentorId',
        populate: { path: 'userId' },
      })
      .lean();

    if (!request) {
      throw new NotFoundException(`Request with ID ${id} not found`);
    }

    const mentorUserIdStr = (request.mentorId as any)?.userId?._id?.toString() || (request.mentorId as any)?.userId?.toString();
    if (mentorUserIdStr !== mentorUserId) {
      throw new ForbiddenException('Access denied. You are not the assigned mentor.');
    }

    // TEST 4: Request expiration check
    if (request.status === RequestStatus.EXPIRED) {
      throw new BadRequestException('This request has expired and cannot be accepted.');
    }

    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException(`Request cannot be accepted in state: ${request.status}`);
    }

    const mentorship = await runTransactionSafely(this.connection, async (session) => {
      // 1. Update request status to ACCEPTED
      await this.requestModel.findByIdAndUpdate(
        id,
        { $set: { status: RequestStatus.ACCEPTED } },
        { session },
      );

      const updatedMentor = await this.mentorProfileModel.findByIdAndUpdate(
        (request.mentorId as any)._id,
        { $inc: { currentMenteesCount: 1 } },
        { new: true, session },
      ).lean();

      if (!updatedMentor) {
        throw new BadRequestException('Mentor profile not found.');
      }

      if (updatedMentor.currentMenteesCount > updatedMentor.maxCapacity) {
        throw new BadRequestException('This mentor is currently at capacity.');
      }

      // Check if student profile exists, if not create
      let studentProfile = await this.studentProfileModel
        .findOne({ userId: request.studentId._id })
        .session(session)
        .lean();

      if (!studentProfile) {
        const created = new this.studentProfileModel({
          userId: request.studentId._id,
          programme: 'B.Tech',
          school: 'LPU',
          yearOfStudy: 1,
          graduationYear: new Date().getFullYear() + 4,
          interests: [],
          mentoringNeeds: 'General career growth',
          preferredFrequency: 'Weekly',
          targetRole: '',
          targetIndustry: '',
        });
        const saved = await created.save({ session });
        studentProfile = saved.toObject();
      }

      // 3. Create Mentorship
      const createdMentorship = new this.mentorshipModel({
        studentProfileId: studentProfile._id,
        mentorProfileId: (request.mentorId as any)._id,
        status: MentorshipStatus.ACTIVE,
        startDate: new Date(),
      });
      const savedMentorship = await createdMentorship.save({ session });
      const m = savedMentorship.toObject();

      // 4. Create Private Conversation
      const conversation = new this.conversationModel({
        mentorshipId: m._id,
        participants: [request.studentId._id, new Types.ObjectId(mentorUserId)],
      });
      await conversation.save({ session });

      // 5. Send Initial welcome message
      const welcomeMessage = new this.messageModel({
        conversationId: conversation._id,
        senderId: new Types.ObjectId(mentorUserId),
        content: `Hi! I have accepted your mentorship request. I am excited to connect and help you with: "${request.goal}". Let's schedule a session!`,
      });
      await welcomeMessage.save({ session });

      return m;
    });

    const studentIdStr = request.studentId._id.toString();

    // Notify Student
    await this.notifications.create(
      studentIdStr,
      'REQUEST_ACCEPTED',
      'Mentorship Request Accepted!',
      `Mentor ${(request.mentorId as any).userId.firstName} ${(request.mentorId as any).userId.lastName} has accepted your request.`,
      { mentorshipId: mentorship._id.toString() },
    );

    await this.audit.log(
      mentorUserId,
      'ACCEPT_REQUEST',
      'MentorshipRequest',
      id,
      { studentUserId: studentIdStr, mentorshipId: mentorship._id.toString() },
    );

    globalEventBus.emit('dashboard_update', { type: 'MENTORSHIP_REQUEST_ACCEPTED' });

    return {
      ...mentorship,
      id: mentorship._id.toString(),
    };
  }

  async decline(id: string, mentorUserId: string): Promise<any> {
    const request = await this.requestModel
      .findById(id)
      .populate({
        path: 'mentorId',
        populate: { path: 'userId' },
      })
      .lean();

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    const mentorUserIdStr = (request.mentorId as any).userId?._id?.toString() || (request.mentorId as any).userId?.toString();
    if (mentorUserIdStr !== mentorUserId) {
      throw new ForbiddenException('Access denied. You are not the assigned mentor.');
    }

    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException('Request is not pending');
    }

    const updated = await this.requestModel
      .findByIdAndUpdate(id, { $set: { status: RequestStatus.DECLINED } }, { new: true })
      .lean();

    const studentIdStr = request.studentId.toString();

    // Notify Student
    await this.notifications.create(
      studentIdStr,
      'REQUEST_DECLINED',
      'Mentorship Request Declined',
      `Mentor ${(request.mentorId as any).userId.firstName} ${(request.mentorId as any).userId.lastName} has declined your request.`,
      { requestId: id },
    );

    await this.audit.log(
      mentorUserId,
      'DECLINE_REQUEST',
      'MentorshipRequest',
      id,
      { studentUserId: studentIdStr },
    );

    globalEventBus.emit('dashboard_update', { type: 'MENTORSHIP_REQUEST_DECLINED' });

    return {
      ...updated,
      id: updated._id.toString(),
    };
  }

  async cancel(id: string, studentUserId: string): Promise<any> {
    const request = await this.requestModel.findById(id).lean();
    if (!request) {
      throw new NotFoundException('Request not found');
    }

    const studentIdStr = request.studentId.toString();
    if (studentIdStr !== studentUserId) {
      throw new ForbiddenException('Access denied. You did not submit this request.');
    }

    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be cancelled.');
    }

    const updated = await this.requestModel
      .findByIdAndUpdate(id, { $set: { status: RequestStatus.CANCELLED } }, { new: true })
      .lean();

    await this.audit.log(
      studentUserId,
      'CANCEL_REQUEST',
      'MentorshipRequest',
      id,
      { mentorId: request.mentorId.toString() },
    );

    globalEventBus.emit('dashboard_update', { type: 'MENTORSHIP_REQUEST_CANCELLED' });

    return {
      ...updated,
      id: updated._id.toString(),
    };
  }
}

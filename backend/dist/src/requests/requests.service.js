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
exports.RequestsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const mentorship_request_schema_1 = require("../database/schemas/mentorship-request.schema");
const mentor_profile_schema_1 = require("../database/schemas/mentor-profile.schema");
const student_profile_schema_1 = require("../database/schemas/student-profile.schema");
const user_schema_1 = require("../database/schemas/user.schema");
const mentorship_schema_1 = require("../database/schemas/mentorship.schema");
const conversation_schema_1 = require("../database/schemas/conversation.schema");
const message_schema_1 = require("../database/schemas/message.schema");
const audit_service_1 = require("../audit/audit.service");
const notifications_service_1 = require("../notifications/notifications.service");
const transaction_helper_1 = require("../database/transaction.helper");
const event_bus_1 = require("../common/event-bus");
let RequestsService = class RequestsService {
    constructor(requestModel, mentorProfileModel, studentProfileModel, userModel, mentorshipModel, conversationModel, messageModel, audit, notifications, connection) {
        this.requestModel = requestModel;
        this.mentorProfileModel = mentorProfileModel;
        this.studentProfileModel = studentProfileModel;
        this.userModel = userModel;
        this.mentorshipModel = mentorshipModel;
        this.conversationModel = conversationModel;
        this.messageModel = messageModel;
        this.audit = audit;
        this.notifications = notifications;
        this.connection = connection;
    }
    async create(studentUserId, dto) {
        const studentProfile = await this.studentProfileModel.findOne({ userId: studentUserId }).lean();
        if (!studentProfile) {
            throw new common_1.BadRequestException('You must complete your career profile before requesting a mentor.');
        }
        const pendingCount = await this.requestModel.countDocuments({
            studentId: new mongoose_2.Types.ObjectId(studentUserId),
            status: mentorship_request_schema_1.RequestStatus.PENDING,
        });
        if (pendingCount >= 3) {
            throw new common_1.BadRequestException('You have reached the maximum limit of 3 pending requests.');
        }
        const mentor = await this.mentorProfileModel.findById(dto.mentorId).populate('userId').lean();
        if (!mentor) {
            throw new common_1.NotFoundException('Mentor not found');
        }
        if (mentor.verificationStatus !== mentor_profile_schema_1.VerificationStatus.VERIFIED) {
            throw new common_1.BadRequestException('This mentor is not verified yet.');
        }
        if (mentor.status !== mentor_profile_schema_1.MentorStatus.ACTIVE || !mentor.acceptingMentees) {
            throw new common_1.BadRequestException('This mentor is not currently accepting new requests.');
        }
        if (mentor.currentMenteesCount >= mentor.maxCapacity) {
            throw new common_1.BadRequestException('This mentor is currently at capacity.');
        }
        const existing = await this.requestModel.findOne({
            studentId: new mongoose_2.Types.ObjectId(studentUserId),
            mentorId: new mongoose_2.Types.ObjectId(dto.mentorId),
            status: { $in: [mentorship_request_schema_1.RequestStatus.PENDING, mentorship_request_schema_1.RequestStatus.ACCEPTED] },
        });
        if (existing) {
            throw new common_1.BadRequestException('You already have a pending request or active mentorship with this mentor.');
        }
        const request = new this.requestModel({
            studentId: new mongoose_2.Types.ObjectId(studentUserId),
            mentorId: new mongoose_2.Types.ObjectId(dto.mentorId),
            message: dto.message,
            goal: dto.goal,
            status: mentorship_request_schema_1.RequestStatus.PENDING,
        });
        await request.save();
        const requestPopulated = await this.requestModel
            .findById(request._id)
            .populate('studentId')
            .lean();
        if (!requestPopulated) {
            throw new common_1.BadRequestException('Failed to retrieve created request details.');
        }
        await this.notifications.create(mentor.userId.toString(), 'NEW_REQUEST', 'New Mentorship Request', `${requestPopulated.studentId.firstName} ${requestPopulated.studentId.lastName} requested you as a mentor for: ${dto.goal}`, { requestId: request._id.toString() });
        await this.audit.log(studentUserId, 'SEND_REQUEST', 'MentorshipRequest', request._id.toString(), { mentorId: dto.mentorId });
        event_bus_1.globalEventBus.emit('dashboard_update', { type: 'MENTORSHIP_REQUEST_CREATED' });
        return {
            ...requestPopulated,
            id: request._id.toString(),
        };
    }
    async findAll(userId, role) {
        if (role === user_schema_1.Role.STUDENT) {
            const list = await this.requestModel
                .find({ studentId: new mongoose_2.Types.ObjectId(userId) })
                .populate({
                path: 'mentorId',
                populate: { path: 'userId' },
            })
                .sort({ createdAt: -1 })
                .lean();
            return list.map((r) => ({
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
        }
        else if (role === user_schema_1.Role.MENTOR) {
            const mentorProfile = await this.mentorProfileModel.findOne({ userId }).lean();
            if (!mentorProfile)
                return [];
            const list = await this.requestModel
                .find({ mentorId: mentorProfile._id })
                .populate('studentId')
                .sort({ createdAt: -1 })
                .lean();
            return list.map((r) => ({
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
        return list.map((r) => ({
            ...r,
            id: r._id.toString(),
            student: r.studentId ? { ...r.studentId, id: r.studentId._id?.toString() } : null,
            mentor: r.mentorId ? { ...r.mentorId, id: r.mentorId._id?.toString() } : null,
        }));
    }
    async findOne(id, userId) {
        const request = await this.requestModel
            .findById(id)
            .populate('studentId')
            .populate({
            path: 'mentorId',
            populate: { path: 'userId' },
        })
            .lean();
        if (!request) {
            throw new common_1.NotFoundException(`Request with ID ${id} not found`);
        }
        const requestStudentIdStr = request.studentId._id?.toString() || request.studentId?.toString();
        const mentorUserIdStr = request.mentorId?.userId?._id?.toString() || request.mentorId?.userId?.toString();
        if (requestStudentIdStr !== userId && mentorUserIdStr !== userId) {
            throw new common_1.ForbiddenException('Access denied. You do not own this request.');
        }
        return {
            ...request,
            id: request._id.toString(),
            student: request.studentId ? { ...request.studentId, id: requestStudentIdStr } : null,
            mentor: request.mentorId
                ? {
                    ...request.mentorId,
                    id: request.mentorId._id?.toString(),
                    user: request.mentorId.userId
                        ? {
                            ...request.mentorId.userId,
                            id: mentorUserIdStr,
                        }
                        : null,
                }
                : null,
        };
    }
    async accept(id, mentorUserId) {
        const request = await this.requestModel
            .findById(id)
            .populate('studentId')
            .populate({
            path: 'mentorId',
            populate: { path: 'userId' },
        })
            .lean();
        if (!request) {
            throw new common_1.NotFoundException(`Request with ID ${id} not found`);
        }
        const mentorUserIdStr = request.mentorId?.userId?._id?.toString() || request.mentorId?.userId?.toString();
        if (mentorUserIdStr !== mentorUserId) {
            throw new common_1.ForbiddenException('Access denied. You are not the assigned mentor.');
        }
        if (request.status === mentorship_request_schema_1.RequestStatus.EXPIRED) {
            throw new common_1.BadRequestException('This request has expired and cannot be accepted.');
        }
        if (request.status !== mentorship_request_schema_1.RequestStatus.PENDING) {
            throw new common_1.BadRequestException(`Request cannot be accepted in state: ${request.status}`);
        }
        const mentorship = await (0, transaction_helper_1.runTransactionSafely)(this.connection, async (session) => {
            await this.requestModel.findByIdAndUpdate(id, { $set: { status: mentorship_request_schema_1.RequestStatus.ACCEPTED } }, { session });
            const updatedMentor = await this.mentorProfileModel.findByIdAndUpdate(request.mentorId._id, { $inc: { currentMenteesCount: 1 } }, { new: true, session }).lean();
            if (!updatedMentor) {
                throw new common_1.BadRequestException('Mentor profile not found.');
            }
            if (updatedMentor.currentMenteesCount > updatedMentor.maxCapacity) {
                throw new common_1.BadRequestException('This mentor is currently at capacity.');
            }
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
            const createdMentorship = new this.mentorshipModel({
                studentProfileId: studentProfile._id,
                mentorProfileId: request.mentorId._id,
                status: mentorship_schema_1.MentorshipStatus.ACTIVE,
                startDate: new Date(),
            });
            const savedMentorship = await createdMentorship.save({ session });
            const m = savedMentorship.toObject();
            const conversation = new this.conversationModel({
                mentorshipId: m._id,
                participants: [request.studentId._id, new mongoose_2.Types.ObjectId(mentorUserId)],
            });
            await conversation.save({ session });
            const welcomeMessage = new this.messageModel({
                conversationId: conversation._id,
                senderId: new mongoose_2.Types.ObjectId(mentorUserId),
                content: `Hi! I have accepted your mentorship request. I am excited to connect and help you with: "${request.goal}". Let's schedule a session!`,
            });
            await welcomeMessage.save({ session });
            return m;
        });
        const studentIdStr = request.studentId._id.toString();
        await this.notifications.create(studentIdStr, 'REQUEST_ACCEPTED', 'Mentorship Request Accepted!', `Mentor ${request.mentorId.userId.firstName} ${request.mentorId.userId.lastName} has accepted your request.`, { mentorshipId: mentorship._id.toString() });
        await this.audit.log(mentorUserId, 'ACCEPT_REQUEST', 'MentorshipRequest', id, { studentUserId: studentIdStr, mentorshipId: mentorship._id.toString() });
        event_bus_1.globalEventBus.emit('dashboard_update', { type: 'MENTORSHIP_REQUEST_ACCEPTED' });
        return {
            ...mentorship,
            id: mentorship._id.toString(),
        };
    }
    async decline(id, mentorUserId) {
        const request = await this.requestModel
            .findById(id)
            .populate({
            path: 'mentorId',
            populate: { path: 'userId' },
        })
            .lean();
        if (!request) {
            throw new common_1.NotFoundException('Request not found');
        }
        const mentorUserIdStr = request.mentorId.userId?._id?.toString() || request.mentorId.userId?.toString();
        if (mentorUserIdStr !== mentorUserId) {
            throw new common_1.ForbiddenException('Access denied. You are not the assigned mentor.');
        }
        if (request.status !== mentorship_request_schema_1.RequestStatus.PENDING) {
            throw new common_1.BadRequestException('Request is not pending');
        }
        const updated = await this.requestModel
            .findByIdAndUpdate(id, { $set: { status: mentorship_request_schema_1.RequestStatus.DECLINED } }, { new: true })
            .lean();
        const studentIdStr = request.studentId.toString();
        await this.notifications.create(studentIdStr, 'REQUEST_DECLINED', 'Mentorship Request Declined', `Mentor ${request.mentorId.userId.firstName} ${request.mentorId.userId.lastName} has declined your request.`, { requestId: id });
        await this.audit.log(mentorUserId, 'DECLINE_REQUEST', 'MentorshipRequest', id, { studentUserId: studentIdStr });
        event_bus_1.globalEventBus.emit('dashboard_update', { type: 'MENTORSHIP_REQUEST_DECLINED' });
        return {
            ...updated,
            id: updated._id.toString(),
        };
    }
    async cancel(id, studentUserId) {
        const request = await this.requestModel.findById(id).lean();
        if (!request) {
            throw new common_1.NotFoundException('Request not found');
        }
        const studentIdStr = request.studentId.toString();
        if (studentIdStr !== studentUserId) {
            throw new common_1.ForbiddenException('Access denied. You did not submit this request.');
        }
        if (request.status !== mentorship_request_schema_1.RequestStatus.PENDING) {
            throw new common_1.BadRequestException('Only pending requests can be cancelled.');
        }
        const updated = await this.requestModel
            .findByIdAndUpdate(id, { $set: { status: mentorship_request_schema_1.RequestStatus.CANCELLED } }, { new: true })
            .lean();
        await this.audit.log(studentUserId, 'CANCEL_REQUEST', 'MentorshipRequest', id, { mentorId: request.mentorId.toString() });
        event_bus_1.globalEventBus.emit('dashboard_update', { type: 'MENTORSHIP_REQUEST_CANCELLED' });
        return {
            ...updated,
            id: updated._id.toString(),
        };
    }
};
exports.RequestsService = RequestsService;
exports.RequestsService = RequestsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(mentorship_request_schema_1.MentorshipRequest.name)),
    __param(1, (0, mongoose_1.InjectModel)(mentor_profile_schema_1.MentorProfile.name)),
    __param(2, (0, mongoose_1.InjectModel)(student_profile_schema_1.StudentProfile.name)),
    __param(3, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(4, (0, mongoose_1.InjectModel)(mentorship_schema_1.Mentorship.name)),
    __param(5, (0, mongoose_1.InjectModel)(conversation_schema_1.Conversation.name)),
    __param(6, (0, mongoose_1.InjectModel)(message_schema_1.Message.name)),
    __param(9, (0, mongoose_1.InjectConnection)()),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        audit_service_1.AuditService,
        notifications_service_1.NotificationsService,
        mongoose_2.Connection])
], RequestsService);
//# sourceMappingURL=requests.service.js.map
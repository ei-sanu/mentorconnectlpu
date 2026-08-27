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
exports.MentorshipsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const mentorship_schema_1 = require("../database/schemas/mentorship.schema");
const mentor_profile_schema_1 = require("../database/schemas/mentor-profile.schema");
const student_profile_schema_1 = require("../database/schemas/student-profile.schema");
const user_schema_1 = require("../database/schemas/user.schema");
const transaction_helper_1 = require("../database/transaction.helper");
let MentorshipsService = class MentorshipsService {
    constructor(mentorshipModel, mentorProfileModel, studentProfileModel, connection) {
        this.mentorshipModel = mentorshipModel;
        this.mentorProfileModel = mentorProfileModel;
        this.studentProfileModel = studentProfileModel;
        this.connection = connection;
    }
    async findAll(userId, role) {
        if (role === user_schema_1.Role.STUDENT) {
            const studentProfile = await this.studentProfileModel.findOne({ userId }).lean();
            if (!studentProfile)
                return [];
            const list = await this.mentorshipModel
                .find({ studentProfileId: studentProfile._id })
                .populate({
                path: 'mentorProfileId',
                populate: { path: 'userId' },
            })
                .lean();
            return list.map((m) => ({
                ...m,
                id: m._id.toString(),
                mentor: m.mentorProfileId
                    ? {
                        ...m.mentorProfileId,
                        id: m.mentorProfileId._id?.toString(),
                        user: m.mentorProfileId.userId
                            ? {
                                ...m.mentorProfileId.userId,
                                id: m.mentorProfileId.userId._id?.toString(),
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
            const list = await this.mentorshipModel
                .find({ mentorProfileId: mentorProfile._id })
                .populate({
                path: 'studentProfileId',
                populate: { path: 'userId' },
            })
                .lean();
            return list.map((m) => ({
                ...m,
                id: m._id.toString(),
                student: m.studentProfileId
                    ? {
                        ...m.studentProfileId,
                        id: m.studentProfileId._id?.toString(),
                        user: m.studentProfileId.userId
                            ? {
                                ...m.studentProfileId.userId,
                                id: m.studentProfileId.userId._id?.toString(),
                            }
                            : null,
                    }
                    : null,
            }));
        }
        const list = await this.mentorshipModel
            .find()
            .populate({ path: 'studentProfileId', populate: { path: 'userId' } })
            .populate({ path: 'mentorProfileId', populate: { path: 'userId' } })
            .lean();
        return list.map((m) => ({
            ...m,
            id: m._id.toString(),
            student: m.studentProfileId ? { ...m.studentProfileId, id: m.studentProfileId._id?.toString() } : null,
            mentor: m.mentorProfileId ? { ...m.mentorProfileId, id: m.mentorProfileId._id?.toString() } : null,
        }));
    }
    async findOne(id, userId, isAdminOrOfficer = false) {
        const mentorship = await this.mentorshipModel
            .findById(id)
            .populate({ path: 'studentProfileId', populate: { path: 'userId' } })
            .populate({ path: 'mentorProfileId', populate: { path: 'userId' } })
            .lean();
        if (!mentorship) {
            throw new common_1.NotFoundException(`Mentorship with ID ${id} not found`);
        }
        const studentUserIdStr = mentorship.studentProfileId.userId?._id?.toString() || mentorship.studentProfileId.userId?.toString();
        const mentorUserIdStr = mentorship.mentorProfileId.userId?._id?.toString() || mentorship.mentorProfileId.userId?.toString();
        if (!isAdminOrOfficer &&
            studentUserIdStr !== userId &&
            mentorUserIdStr !== userId) {
            throw new common_1.ForbiddenException('Access Denied. You do not participate in this mentorship.');
        }
        return {
            ...mentorship,
            id: mentorship._id.toString(),
            studentProfile: mentorship.studentProfileId
                ? {
                    ...mentorship.studentProfileId,
                    id: mentorship.studentProfileId._id?.toString(),
                    user: mentorship.studentProfileId.userId
                        ? {
                            ...mentorship.studentProfileId.userId,
                            id: studentUserIdStr,
                        }
                        : null,
                }
                : null,
            mentorProfile: mentorship.mentorProfileId
                ? {
                    ...mentorship.mentorProfileId,
                    id: mentorship.mentorProfileId._id?.toString(),
                    user: mentorship.mentorProfileId.userId
                        ? {
                            ...mentorship.mentorProfileId.userId,
                            id: mentorUserIdStr,
                        }
                        : null,
                }
                : null,
        };
    }
    async updateStatus(id, userId, status) {
        const mentorship = await this.findOne(id, userId);
        const validTransitions = {
            ACTIVE: ['PAUSED', 'COMPLETED', 'CANCELLED'],
            PAUSED: ['ACTIVE', 'COMPLETED', 'CANCELLED'],
            COMPLETED: [],
            CANCELLED: [],
        };
        const allowed = validTransitions[mentorship.status] || [];
        if (!allowed.includes(status)) {
            throw new common_1.BadRequestException(`Cannot transition mentorship from state ${mentorship.status} to ${status}`);
        }
        const updated = await (0, transaction_helper_1.runTransactionSafely)(this.connection, async (session) => {
            const u = await this.mentorshipModel.findByIdAndUpdate(id, { $set: { status } }, { new: true, session }).lean();
            if (status === mentorship_schema_1.MentorshipStatus.COMPLETED || status === mentorship_schema_1.MentorshipStatus.CANCELLED) {
                const mentorProfileId = new mongoose_2.Types.ObjectId(mentorship.mentorProfile.id);
                const mentorProfile = await this.mentorProfileModel.findById(mentorProfileId).session(session).lean();
                if (mentorProfile && mentorProfile.currentMenteesCount > 0) {
                    await this.mentorProfileModel.findByIdAndUpdate(mentorProfileId, { $inc: { currentMenteesCount: -1 } }, { session });
                }
            }
            return u;
        });
        return {
            ...updated,
            id: updated._id.toString(),
        };
    }
};
exports.MentorshipsService = MentorshipsService;
exports.MentorshipsService = MentorshipsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(mentorship_schema_1.Mentorship.name)),
    __param(1, (0, mongoose_1.InjectModel)(mentor_profile_schema_1.MentorProfile.name)),
    __param(2, (0, mongoose_1.InjectModel)(student_profile_schema_1.StudentProfile.name)),
    __param(3, (0, mongoose_1.InjectConnection)()),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Connection])
], MentorshipsService);
//# sourceMappingURL=mentorships.service.js.map
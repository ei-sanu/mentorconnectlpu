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
exports.GoalsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const goal_schema_1 = require("../database/schemas/goal.schema");
const mentorship_schema_1 = require("../database/schemas/mentorship.schema");
const notifications_service_1 = require("../notifications/notifications.service");
let GoalsService = class GoalsService {
    constructor(goalModel, mentorshipModel, notifications) {
        this.goalModel = goalModel;
        this.mentorshipModel = mentorshipModel;
        this.notifications = notifications;
    }
    async findGoalsForMentorship(mentorshipId, userId) {
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
            throw new common_1.ForbiddenException('Access denied. You do not participate in this mentorship.');
        }
        const list = await this.goalModel
            .find({ mentorshipId: new mongoose_2.Types.ObjectId(mentorshipId) })
            .sort({ targetDate: 1 })
            .lean();
        return list.map((g) => ({
            ...g,
            id: g._id.toString(),
        }));
    }
    async createGoal(mentorshipId, userId, dto) {
        const mentorship = await this.mentorshipModel
            .findById(mentorshipId)
            .populate({ path: 'studentProfileId', populate: { path: 'userId' } })
            .populate({ path: 'mentorProfileId', populate: { path: 'userId' } })
            .lean();
        if (!mentorship) {
            throw new common_1.NotFoundException('Mentorship not found');
        }
        const studentUserIdStr = mentorship.studentProfileId.userId?._id?.toString();
        const mentorUserIdStr = mentorship.mentorProfileId.userId?._id?.toString();
        if (studentUserIdStr !== userId && mentorUserIdStr !== userId) {
            throw new common_1.ForbiddenException('Access denied. You do not participate in this mentorship.');
        }
        const goal = new this.goalModel({
            mentorshipId: new mongoose_2.Types.ObjectId(mentorshipId),
            title: dto.title,
            description: dto.description,
            targetDate: new Date(dto.targetDate),
            status: goal_schema_1.GoalStatus.NOT_STARTED,
            progress: 0,
        });
        await goal.save();
        const goalIdStr = goal._id.toString();
        const receiverId = userId === studentUserIdStr ? mentorUserIdStr : studentUserIdStr;
        const creatorName = userId === studentUserIdStr
            ? `${mentorship.studentProfileId.userId.firstName} ${mentorship.studentProfileId.userId.lastName}`
            : `${mentorship.mentorProfileId.userId.firstName} ${mentorship.mentorProfileId.userId.lastName}`;
        await this.notifications.create(receiverId, 'GOAL_CREATED', 'New Mentorship Goal Added', `${creatorName} added a new goal: "${dto.title}"`, { goalId: goalIdStr, mentorshipId });
        return {
            ...goal.toObject(),
            id: goalIdStr,
        };
    }
    async updateGoal(id, userId, dto) {
        const goal = await this.goalModel
            .findById(id)
            .populate({
            path: 'mentorshipId',
            populate: [
                { path: 'studentProfileId' },
                { path: 'mentorProfileId' },
            ],
        })
            .lean();
        if (!goal) {
            throw new common_1.NotFoundException('Goal not found');
        }
        const studentUserIdStr = goal.mentorshipId.studentProfileId?.userId?.toString();
        const mentorUserIdStr = goal.mentorshipId.mentorProfileId?.userId?.toString();
        if (studentUserIdStr !== userId && mentorUserIdStr !== userId) {
            throw new common_1.ForbiddenException('Access denied');
        }
        const data = { ...dto };
        if (dto.status === goal_schema_1.GoalStatus.COMPLETED) {
            data.completedAt = new Date();
            data.progress = 100;
        }
        else if (dto.status && dto.status !== goal_schema_1.GoalStatus.COMPLETED) {
            data.completedAt = null;
        }
        if (dto.targetDate) {
            data.targetDate = new Date(dto.targetDate);
        }
        const updated = await this.goalModel
            .findByIdAndUpdate(id, { $set: data }, { new: true })
            .lean();
        return {
            ...updated,
            id: updated._id.toString(),
        };
    }
    async deleteGoal(id, userId) {
        const goal = await this.goalModel
            .findById(id)
            .populate({
            path: 'mentorshipId',
            populate: [
                { path: 'studentProfileId' },
                { path: 'mentorProfileId' },
            ],
        })
            .lean();
        if (!goal) {
            throw new common_1.NotFoundException('Goal not found');
        }
        const studentUserIdStr = goal.mentorshipId.studentProfileId?.userId?.toString();
        const mentorUserIdStr = goal.mentorshipId.mentorProfileId?.userId?.toString();
        if (studentUserIdStr !== userId && mentorUserIdStr !== userId) {
            throw new common_1.ForbiddenException('Access denied');
        }
        await this.goalModel.findByIdAndDelete(id);
        return { success: true, message: 'Goal deleted successfully.' };
    }
};
exports.GoalsService = GoalsService;
exports.GoalsService = GoalsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(goal_schema_1.Goal.name)),
    __param(1, (0, mongoose_1.InjectModel)(mentorship_schema_1.Mentorship.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        notifications_service_1.NotificationsService])
], GoalsService);
//# sourceMappingURL=goals.service.js.map
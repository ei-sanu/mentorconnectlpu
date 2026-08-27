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
exports.ActionItemsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const action_item_schema_1 = require("../database/schemas/action-item.schema");
const mentorship_schema_1 = require("../database/schemas/mentorship.schema");
const notifications_service_1 = require("../notifications/notifications.service");
let ActionItemsService = class ActionItemsService {
    constructor(actionItemModel, mentorshipModel, notifications) {
        this.actionItemModel = actionItemModel;
        this.mentorshipModel = mentorshipModel;
        this.notifications = notifications;
    }
    async findActionItemsForMentorship(mentorshipId, userId) {
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
        const list = await this.actionItemModel
            .find({ mentorshipId: new mongoose_2.Types.ObjectId(mentorshipId) })
            .sort({ dueDate: 1 })
            .lean();
        return list.map((a) => ({
            ...a,
            id: a._id.toString(),
        }));
    }
    async createActionItem(mentorshipId, userId, dto) {
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
        const item = new this.actionItemModel({
            mentorshipId: new mongoose_2.Types.ObjectId(mentorshipId),
            goalId: dto.goalId ? new mongoose_2.Types.ObjectId(dto.goalId) : undefined,
            task: dto.task,
            assignedToId: new mongoose_2.Types.ObjectId(dto.assignedToId),
            createdById: new mongoose_2.Types.ObjectId(userId),
            dueDate: new Date(dto.dueDate),
            status: action_item_schema_1.ActionItemStatus.PENDING,
        });
        await item.save();
        const itemIdStr = item._id.toString();
        const assignerName = userId === studentUserIdStr
            ? `${mentorship.studentProfileId.userId.firstName} ${mentorship.studentProfileId.userId.lastName}`
            : `${mentorship.mentorProfileId.userId.firstName} ${mentorship.mentorProfileId.userId.lastName}`;
        await this.notifications.create(dto.assignedToId, 'ACTION_ITEM_ASSIGNED', 'New Action Item Assigned', `${assignerName} assigned a task to you: "${dto.task}"`, { actionItemId: itemIdStr, mentorshipId });
        return {
            ...item.toObject(),
            id: itemIdStr,
        };
    }
    async updateActionItem(id, userId, dto) {
        const item = await this.actionItemModel
            .findById(id)
            .populate({
            path: 'mentorshipId',
            populate: [
                { path: 'studentProfileId' },
                { path: 'mentorProfileId' },
            ],
        })
            .lean();
        if (!item) {
            throw new common_1.NotFoundException('Action item not found');
        }
        const studentUserIdStr = item.mentorshipId.studentProfileId?.userId?.toString();
        const mentorUserIdStr = item.mentorshipId.mentorProfileId?.userId?.toString();
        if (studentUserIdStr !== userId && mentorUserIdStr !== userId) {
            throw new common_1.ForbiddenException('Access denied');
        }
        const data = { ...dto };
        if (dto.status === action_item_schema_1.ActionItemStatus.COMPLETED) {
            data.completedAt = new Date();
        }
        else if (dto.status && dto.status !== action_item_schema_1.ActionItemStatus.COMPLETED) {
            data.completedAt = null;
        }
        if (dto.dueDate) {
            data.dueDate = new Date(dto.dueDate);
        }
        const updated = await this.actionItemModel
            .findByIdAndUpdate(id, { $set: data }, { new: true })
            .lean();
        return {
            ...updated,
            id: updated._id.toString(),
        };
    }
};
exports.ActionItemsService = ActionItemsService;
exports.ActionItemsService = ActionItemsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(action_item_schema_1.ActionItem.name)),
    __param(1, (0, mongoose_1.InjectModel)(mentorship_schema_1.Mentorship.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        notifications_service_1.NotificationsService])
], ActionItemsService);
//# sourceMappingURL=action-items.service.js.map
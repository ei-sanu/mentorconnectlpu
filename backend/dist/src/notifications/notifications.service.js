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
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const notification_schema_1 = require("../database/schemas/notification.schema");
let NotificationsService = class NotificationsService {
    constructor(notificationModel) {
        this.notificationModel = notificationModel;
    }
    async create(userId, type, title, message, metadata) {
        const notification = new this.notificationModel({
            userId: new mongoose_2.Types.ObjectId(userId),
            type,
            title,
            message,
            read: false,
            metadata,
        });
        await notification.save();
        return {
            ...notification.toObject(),
            id: notification._id.toString(),
        };
    }
    async findAll(userId) {
        const list = await this.notificationModel
            .find({ userId: new mongoose_2.Types.ObjectId(userId) })
            .sort({ createdAt: -1 })
            .lean();
        return list.map((n) => ({
            ...n,
            id: n._id.toString(),
        }));
    }
    async markAsRead(id, userId) {
        const updated = await this.notificationModel
            .findOneAndUpdate({ _id: new mongoose_2.Types.ObjectId(id), userId: new mongoose_2.Types.ObjectId(userId) }, { $set: { read: true } }, { new: true })
            .lean();
        if (!updated) {
            throw new common_1.NotFoundException(`Notification not found or access denied.`);
        }
        return {
            ...updated,
            id: updated._id.toString(),
        };
    }
    async markAllAsRead(userId) {
        await this.notificationModel.updateMany({ userId: new mongoose_2.Types.ObjectId(userId), read: false }, { $set: { read: true } });
        return { success: true };
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(notification_schema_1.Notification.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map
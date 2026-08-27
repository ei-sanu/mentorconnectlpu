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
exports.MessagingService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const conversation_schema_1 = require("../database/schemas/conversation.schema");
const message_schema_1 = require("../database/schemas/message.schema");
const user_schema_1 = require("../database/schemas/user.schema");
let MessagingService = class MessagingService {
    constructor(conversationModel, messageModel, userModel) {
        this.conversationModel = conversationModel;
        this.messageModel = messageModel;
        this.userModel = userModel;
    }
    async getConversations(userId) {
        const userIdObj = new mongoose_2.Types.ObjectId(userId);
        const conversations = await this.conversationModel
            .find({ participants: userIdObj })
            .populate('participants')
            .lean();
        const mapped = [];
        for (const c of conversations) {
            const otherParticipant = c.participants.find((p) => p._id.toString() !== userId);
            const lastMessage = await this.messageModel
                .findOne({ conversationId: c._id })
                .sort({ createdAt: -1 })
                .lean();
            mapped.push({
                id: c._id.toString(),
                mentorshipId: c.mentorshipId.toString(),
                updatedAt: c.updatedAt,
                otherUser: otherParticipant
                    ? {
                        id: otherParticipant._id.toString(),
                        firstName: otherParticipant.firstName,
                        lastName: otherParticipant.lastName,
                        avatar: otherParticipant.avatar,
                        role: otherParticipant.role,
                    }
                    : null,
                lastMessage: lastMessage
                    ? {
                        id: lastMessage._id.toString(),
                        content: lastMessage.content,
                        senderId: lastMessage.senderId.toString(),
                        createdAt: lastMessage.createdAt,
                    }
                    : null,
            });
        }
        return mapped;
    }
    async getMessages(conversationId, userId, limit = 20, before) {
        const conversationIdObj = new mongoose_2.Types.ObjectId(conversationId);
        const userIdObj = new mongoose_2.Types.ObjectId(userId);
        const conversation = await this.conversationModel.findOne({
            _id: conversationIdObj,
            participants: userIdObj,
        });
        if (!conversation) {
            throw new common_1.ForbiddenException('Access denied. You do not participate in this conversation.');
        }
        const query = { conversationId: conversationIdObj };
        if (before) {
            const beforeMessage = await this.messageModel.findById(before).lean();
            if (beforeMessage) {
                query.createdAt = { $lt: beforeMessage.createdAt };
            }
        }
        const messages = await this.messageModel
            .find(query)
            .populate('senderId')
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();
        return messages.reverse().map((m) => ({
            id: m._id.toString(),
            content: m.content,
            senderId: m.senderId._id?.toString() || m.senderId?.toString(),
            senderName: m.senderId ? `${m.senderId.firstName} ${m.senderId.lastName}` : 'System',
            createdAt: m.createdAt,
        }));
    }
    async sendMessage(conversationId, senderId, content) {
        const conversationIdObj = new mongoose_2.Types.ObjectId(conversationId);
        const senderIdObj = new mongoose_2.Types.ObjectId(senderId);
        const conversation = await this.conversationModel.findOne({
            _id: conversationIdObj,
            participants: senderIdObj,
        });
        if (!conversation) {
            throw new common_1.ForbiddenException('Access denied. You are not a participant in this conversation.');
        }
        const message = new this.messageModel({
            conversationId: conversationIdObj,
            senderId: senderIdObj,
            content,
        });
        await message.save();
        await this.conversationModel.findByIdAndUpdate(conversationId, {
            $set: { updatedAt: new Date() },
        });
        const populated = await this.messageModel.findById(message._id).populate('senderId').lean();
        return {
            id: message._id.toString(),
            conversationId,
            content: message.content,
            senderId: message.senderId.toString(),
            senderName: `${populated.senderId.firstName} ${populated.senderId.lastName}`,
            createdAt: populated.createdAt,
        };
    }
};
exports.MessagingService = MessagingService;
exports.MessagingService = MessagingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(conversation_schema_1.Conversation.name)),
    __param(1, (0, mongoose_1.InjectModel)(message_schema_1.Message.name)),
    __param(2, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], MessagingService);
//# sourceMappingURL=messaging.service.js.map
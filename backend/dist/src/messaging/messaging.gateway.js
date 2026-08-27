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
var MessagingGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagingGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const messaging_service_1 = require("./messaging.service");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("../database/schemas/user.schema");
const conversation_schema_1 = require("../database/schemas/conversation.schema");
const common_1 = require("@nestjs/common");
const jwt = require("jsonwebtoken");
const event_bus_1 = require("../common/event-bus");
let MessagingGateway = MessagingGateway_1 = class MessagingGateway {
    constructor(messagingService, userModel, conversationModel) {
        this.messagingService = messagingService;
        this.userModel = userModel;
        this.conversationModel = conversationModel;
        this.logger = new common_1.Logger(MessagingGateway_1.name);
        event_bus_1.globalEventBus.on('dashboard_update', () => {
            this.logger.log('Broadcasting dashboard_update event to WebSocket clients');
            try {
                if (this.server) {
                    this.server.emit('dashboard_update');
                }
            }
            catch (err) {
                this.logger.warn(`Failed to broadcast dashboard_update: ${err.message}`);
            }
        });
    }
    async handleConnection(client) {
        try {
            const authHeader = client.handshake.auth?.token || client.handshake.headers?.authorization;
            if (!authHeader) {
                client.disconnect(true);
                return;
            }
            const token = authHeader.replace('Bearer ', '');
            let clerkUserId;
            if (token.startsWith('mock_token_')) {
                clerkUserId = token.replace('mock_token_', '');
            }
            else {
                const jwksUri = process.env.CLERK_JWKS_URL;
                if (!jwksUri || !jwksUri.startsWith('https')) {
                    this.logger.warn('Real JWT received but CLERK_JWKS_URL not configured for WebSocket auth');
                    client.disconnect(true);
                    return;
                }
                try {
                    const jwksRsa = require('jwks-rsa');
                    const jwksClient = jwksRsa({
                        jwksUri,
                        cache: true,
                        rateLimit: true,
                        jwksRequestsPerMinute: 10,
                    });
                    const decodedHeader = jwt.decode(token, { complete: true });
                    if (!decodedHeader?.header?.kid) {
                        client.disconnect(true);
                        return;
                    }
                    const key = await jwksClient.getSigningKey(decodedHeader.header.kid);
                    const publicKey = key.getPublicKey();
                    const verified = jwt.verify(token, publicKey);
                    clerkUserId = verified.sub;
                }
                catch (jwtErr) {
                    this.logger.warn(`WebSocket JWT verification failed: ${jwtErr.message}`);
                    client.disconnect(true);
                    return;
                }
            }
            const user = await this.userModel.findOne({ clerkUserId }).lean();
            if (!user) {
                client.disconnect(true);
                return;
            }
            client.data.user = {
                ...user,
                id: user._id.toString(),
            };
            this.logger.log(`Socket Client Connected: ${user.firstName} ${user.lastName} (ID: ${user._id.toString()})`);
        }
        catch (err) {
            this.logger.error(`Socket connection error: ${err.message}`);
            client.disconnect(true);
        }
    }
    handleDisconnect(client) {
        if (client.data?.user) {
            this.logger.log(`Socket Client Disconnected: ${client.data.user.firstName}`);
        }
    }
    async handleJoinConversation(client, data) {
        const userId = client.data.user?.id;
        if (!userId)
            return;
        try {
            const conversation = await this.conversationModel.findOne({
                _id: new mongoose_2.Types.ObjectId(data.conversationId),
                participants: new mongoose_2.Types.ObjectId(userId),
            });
            if (conversation) {
                client.join(`conversation:${data.conversationId}`);
                this.logger.log(`User ${userId} joined room conversation:${data.conversationId}`);
                client.emit('joined_room', { conversationId: data.conversationId });
            }
            else {
                client.emit('error', { message: 'Not authorized for this conversation' });
            }
        }
        catch (error) {
            client.emit('error', { message: 'Invalid conversation reference' });
        }
    }
    async handleSendMessage(client, data) {
        const userId = client.data.user?.id;
        if (!userId)
            return;
        try {
            const message = await this.messagingService.sendMessage(data.conversationId, userId, data.content);
            this.server.to(`conversation:${data.conversationId}`).emit('new_message', message);
        }
        catch (err) {
            client.emit('error', { message: err.message });
        }
    }
    handleTyping(client, data) {
        const userId = client.data.user?.id;
        if (!userId)
            return;
        client.to(`conversation:${data.conversationId}`).emit('typing', {
            userId,
            isTyping: data.isTyping,
        });
    }
};
exports.MessagingGateway = MessagingGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], MessagingGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join_conversation'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], MessagingGateway.prototype, "handleJoinConversation", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('send_message'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], MessagingGateway.prototype, "handleSendMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('typing'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], MessagingGateway.prototype, "handleTyping", null);
exports.MessagingGateway = MessagingGateway = MessagingGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            credentials: true,
        },
        namespace: 'chat',
    }),
    __param(1, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(2, (0, mongoose_1.InjectModel)(conversation_schema_1.Conversation.name)),
    __metadata("design:paramtypes", [messaging_service_1.MessagingService,
        mongoose_2.Model,
        mongoose_2.Model])
], MessagingGateway);
//# sourceMappingURL=messaging.gateway.js.map
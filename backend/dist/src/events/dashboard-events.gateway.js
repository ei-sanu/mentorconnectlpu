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
var DashboardEventsGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardEventsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const jwt = require("jsonwebtoken");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("../database/schemas/user.schema");
const event_bus_1 = require("../common/event-bus");
const dashboard_events_service_1 = require("./dashboard-events.service");
const EVENT_ROOMS = {
    VERIFICATION_SUBMITTED: [user_schema_1.Role.ALUMNI_OFFICER],
    VERIFICATION_APPROVED: [user_schema_1.Role.ALUMNI_OFFICER],
    VERIFICATION_REJECTED: [user_schema_1.Role.ALUMNI_OFFICER],
    VERIFICATION_CHANGES_REQUESTED: [user_schema_1.Role.ALUMNI_OFFICER],
    MENTORSHIP_REQUEST_CREATED: [user_schema_1.Role.PLACEMENT_OFFICER],
    MENTORSHIP_REQUEST_ACCEPTED: [user_schema_1.Role.PLACEMENT_OFFICER],
    MENTORSHIP_REQUEST_DECLINED: [user_schema_1.Role.PLACEMENT_OFFICER],
    MENTORSHIP_REQUEST_CANCELLED: [user_schema_1.Role.PLACEMENT_OFFICER],
    SESSION_BOOKED: [user_schema_1.Role.PLACEMENT_OFFICER],
};
let DashboardEventsGateway = DashboardEventsGateway_1 = class DashboardEventsGateway {
    constructor(userModel, dashboardEventsService) {
        this.userModel = userModel;
        this.dashboardEventsService = dashboardEventsService;
        this.logger = new common_1.Logger(DashboardEventsGateway_1.name);
        event_bus_1.globalEventBus.on('dashboard_update', (payload) => {
            this.handleDashboardUpdate(payload);
        });
    }
    afterInit() {
        this.logger.log('Dashboard events gateway initialised');
    }
    handleDashboardUpdate(payload) {
        try {
            const type = payload?.type ?? 'DATA_CHANGED';
            const rooms = EVENT_ROOMS[type] ?? [user_schema_1.Role.ALUMNI_OFFICER, user_schema_1.Role.PLACEMENT_OFFICER];
            if (payload?.targetRole === 'MENTOR') {
                rooms.length = 0;
                rooms.push(user_schema_1.Role.ALUMNI_OFFICER);
            }
            else if (payload?.targetRole === 'STUDENT') {
                rooms.length = 0;
                rooms.push(user_schema_1.Role.PLACEMENT_OFFICER);
            }
            const event = { type, occurredAt: new Date().toISOString() };
            for (const room of rooms) {
                this.server?.to(`role:${room}`).emit('dashboard:update', event);
            }
            this.dashboardEventsService.bustDashboardCaches();
        }
        catch (err) {
            this.logger.warn(`Failed to forward dashboard event: ${err.message}`);
        }
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
                    this.logger.warn('Dashboard WS: real JWT received but CLERK_JWKS_URL not configured');
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
                    this.logger.warn(`Dashboard WS JWT verification failed: ${jwtErr.message}`);
                    client.disconnect(true);
                    return;
                }
            }
            const user = await this.userModel.findOne({ clerkUserId }).lean();
            if (!user) {
                client.disconnect(true);
                return;
            }
            client.data.user = { id: user._id.toString(), role: user.role };
            client.join(`role:${user.role}`);
            if (user.role === user_schema_1.Role.ADMIN) {
                client.join(`role:${user_schema_1.Role.ALUMNI_OFFICER}`);
                client.join(`role:${user_schema_1.Role.PLACEMENT_OFFICER}`);
            }
            this.logger.log(`Dashboard socket connected: ${user.role} (${user._id.toString()})`);
        }
        catch (err) {
            this.logger.error(`Dashboard socket connection error: ${err.message}`);
            client.disconnect(true);
        }
    }
    handleDisconnect(client) {
        if (client.data?.user?.id) {
            this.logger.log(`Dashboard socket disconnected: ${client.data.user.id}`);
        }
    }
};
exports.DashboardEventsGateway = DashboardEventsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], DashboardEventsGateway.prototype, "server", void 0);
exports.DashboardEventsGateway = DashboardEventsGateway = DashboardEventsGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            credentials: true,
        },
        namespace: 'dashboard',
    }),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        dashboard_events_service_1.DashboardEventsService])
], DashboardEventsGateway);
//# sourceMappingURL=dashboard-events.gateway.js.map
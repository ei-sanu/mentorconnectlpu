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
exports.SessionsController = void 0;
const common_1 = require("@nestjs/common");
const sessions_service_1 = require("./sessions.service");
const create_session_dto_1 = require("./dto/create-session.dto");
const clerk_auth_guard_1 = require("../auth/clerk-auth.guard");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const swagger_1 = require("@nestjs/swagger");
let SessionsController = class SessionsController {
    constructor(sessionsService) {
        this.sessionsService = sessionsService;
    }
    async getSessions(mentorshipId, user) {
        const list = await this.sessionsService.findSessionsForMentorship(mentorshipId, user.id);
        return { success: true, data: list };
    }
    async createSession(mentorshipId, user, dto) {
        const session = await this.sessionsService.createSession(mentorshipId, user.id, dto);
        return { success: true, data: session };
    }
    async updateSession(id, user, dto) {
        const updated = await this.sessionsService.updateSession(id, user.id, dto);
        return { success: true, data: updated };
    }
    async cancelSession(id, user) {
        const cancelled = await this.sessionsService.cancelSession(id, user.id);
        return { success: true, data: cancelled };
    }
};
exports.SessionsController = SessionsController;
__decorate([
    (0, common_1.Get)('mentorships/:id/sessions'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all sessions for a mentorship relationship' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "getSessions", null);
__decorate([
    (0, common_1.Post)('mentorships/:id/sessions'),
    (0, swagger_1.ApiOperation)({ summary: 'Book a session for a mentorship (Student or Mentor)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, create_session_dto_1.CreateSessionDto]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "createSession", null);
__decorate([
    (0, common_1.Patch)('sessions/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update or reschedule a session' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "updateSession", null);
__decorate([
    (0, common_1.Delete)('sessions/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel a session' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "cancelSession", null);
exports.SessionsController = SessionsController = __decorate([
    (0, swagger_1.ApiTags)('Sessions'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(clerk_auth_guard_1.ClerkAuthGuard),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [sessions_service_1.SessionsService])
], SessionsController);
//# sourceMappingURL=sessions.controller.js.map
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
exports.MentorshipsController = void 0;
const common_1 = require("@nestjs/common");
const mentorships_service_1 = require("./mentorships.service");
const clerk_auth_guard_1 = require("../auth/clerk-auth.guard");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const swagger_1 = require("@nestjs/swagger");
let MentorshipsController = class MentorshipsController {
    constructor(mentorshipsService) {
        this.mentorshipsService = mentorshipsService;
    }
    async getAll(user) {
        const list = await this.mentorshipsService.findAll(user.id, user.role);
        return { success: true, data: list };
    }
    async getOne(id, user) {
        const mentorship = await this.mentorshipsService.findOne(id, user.id);
        return { success: true, data: mentorship };
    }
    async update(id, user, status) {
        const updated = await this.mentorshipsService.updateStatus(id, user.id, status);
        return { success: true, data: updated };
    }
};
exports.MentorshipsController = MentorshipsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: "Get all mentorships related to logged-in user" }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MentorshipsController.prototype, "getAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get details of specific mentorship' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MentorshipsController.prototype, "getOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update mentorship status (e.g. Pause, Complete)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], MentorshipsController.prototype, "update", null);
exports.MentorshipsController = MentorshipsController = __decorate([
    (0, swagger_1.ApiTags)('Mentorships'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(clerk_auth_guard_1.ClerkAuthGuard),
    (0, common_1.Controller)('mentorships'),
    __metadata("design:paramtypes", [mentorships_service_1.MentorshipsService])
], MentorshipsController);
//# sourceMappingURL=mentorships.controller.js.map
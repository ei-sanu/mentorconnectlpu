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
exports.MentorsController = void 0;
const common_1 = require("@nestjs/common");
const mentors_service_1 = require("./mentors.service");
const mentor_query_dto_1 = require("./dto/mentor-query.dto");
const update_mentor_profile_dto_1 = require("./dto/update-mentor-profile.dto");
const clerk_auth_guard_1 = require("../auth/clerk-auth.guard");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const swagger_1 = require("@nestjs/swagger");
let MentorsController = class MentorsController {
    constructor(mentorsService) {
        this.mentorsService = mentorsService;
    }
    async getMentors(query) {
        return this.mentorsService.findMany(query);
    }
    async getMyProfile(user) {
        const profile = await this.mentorsService.getProfileByUserId(user.id);
        return { success: true, data: profile };
    }
    async updateMyProfile(user, dto) {
        const updated = await this.mentorsService.updateProfile(user.id, dto);
        return { success: true, data: updated };
    }
    async getMentorById(id) {
        const mentor = await this.mentorsService.findOne(id);
        return { success: true, data: mentor };
    }
    async getMentorAvailability(id) {
        const availability = await this.mentorsService.getAvailability(id);
        return { success: true, data: availability };
    }
};
exports.MentorsController = MentorsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Search and filter mentors' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of mentors with pagination.' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mentor_query_dto_1.MentorQueryDto]),
    __metadata("design:returntype", Promise)
], MentorsController.prototype, "getMentors", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current mentor profile' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MentorsController.prototype, "getMyProfile", null);
__decorate([
    (0, common_1.Patch)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Update current mentor profile' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_mentor_profile_dto_1.UpdateMentorProfileDto]),
    __metadata("design:returntype", Promise)
], MentorsController.prototype, "updateMyProfile", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get mentor by profile ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MentorsController.prototype, "getMentorById", null);
__decorate([
    (0, common_1.Get)(':id/availability'),
    (0, swagger_1.ApiOperation)({ summary: 'Get mentor availability slots' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MentorsController.prototype, "getMentorAvailability", null);
exports.MentorsController = MentorsController = __decorate([
    (0, swagger_1.ApiTags)('Mentors'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(clerk_auth_guard_1.ClerkAuthGuard),
    (0, common_1.Controller)('mentors'),
    __metadata("design:paramtypes", [mentors_service_1.MentorsService])
], MentorsController);
//# sourceMappingURL=mentors.controller.js.map
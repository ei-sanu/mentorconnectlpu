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
exports.RecommendationsController = void 0;
const common_1 = require("@nestjs/common");
const recommendations_service_1 = require("./recommendations.service");
const clerk_auth_guard_1 = require("../auth/clerk-auth.guard");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const swagger_1 = require("@nestjs/swagger");
let RecommendationsController = class RecommendationsController {
    constructor(recommendationsService) {
        this.recommendationsService = recommendationsService;
    }
    async getRecommendations(user) {
        const list = await this.recommendationsService.getRecommendedMentors(user.id);
        return { success: true, data: list };
    }
    async getMatchDetails(user, mentorId) {
        const details = await this.recommendationsService.getMentorMatchDetails(user.id, mentorId);
        return { success: true, data: details };
    }
    async recalculate(user) {
        await this.recommendationsService.invalidateAllCaches();
        return { success: true, message: 'Recommendations cache invalidated.' };
    }
};
exports.RecommendationsController = RecommendationsController;
__decorate([
    (0, common_1.Get)('mentors'),
    (0, swagger_1.ApiOperation)({ summary: 'Get AI recommended mentors for logged-in student' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RecommendationsController.prototype, "getRecommendations", null);
__decorate([
    (0, common_1.Get)('mentors/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get explainable match details for a specific mentor' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], RecommendationsController.prototype, "getMatchDetails", null);
__decorate([
    (0, common_1.Post)('recalculate'),
    (0, swagger_1.ApiOperation)({ summary: 'Invalidate recommendation caches' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RecommendationsController.prototype, "recalculate", null);
exports.RecommendationsController = RecommendationsController = __decorate([
    (0, swagger_1.ApiTags)('Recommendations'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(clerk_auth_guard_1.ClerkAuthGuard),
    (0, common_1.Controller)('recommendations'),
    __metadata("design:paramtypes", [recommendations_service_1.RecommendationsService])
], RecommendationsController);
//# sourceMappingURL=recommendations.controller.js.map
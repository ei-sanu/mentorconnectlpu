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
exports.GoalsController = void 0;
const common_1 = require("@nestjs/common");
const goals_service_1 = require("./goals.service");
const create_goal_dto_1 = require("./dto/create-goal.dto");
const clerk_auth_guard_1 = require("../auth/clerk-auth.guard");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const swagger_1 = require("@nestjs/swagger");
let GoalsController = class GoalsController {
    constructor(goalsService) {
        this.goalsService = goalsService;
    }
    async getGoals(mentorshipId, user) {
        const list = await this.goalsService.findGoalsForMentorship(mentorshipId, user.id);
        return { success: true, data: list };
    }
    async createGoal(mentorshipId, user, dto) {
        const goal = await this.goalsService.createGoal(mentorshipId, user.id, dto);
        return { success: true, data: goal };
    }
    async updateGoal(id, user, dto) {
        const updated = await this.goalsService.updateGoal(id, user.id, dto);
        return { success: true, data: updated };
    }
    async deleteGoal(id, user) {
        const result = await this.goalsService.deleteGoal(id, user.id);
        return result;
    }
};
exports.GoalsController = GoalsController;
__decorate([
    (0, common_1.Get)('mentorships/:id/goals'),
    (0, swagger_1.ApiOperation)({ summary: 'Get goals for a mentorship' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], GoalsController.prototype, "getGoals", null);
__decorate([
    (0, common_1.Post)('mentorships/:id/goals'),
    (0, swagger_1.ApiOperation)({ summary: 'Create goal for a mentorship' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, create_goal_dto_1.CreateGoalDto]),
    __metadata("design:returntype", Promise)
], GoalsController.prototype, "createGoal", null);
__decorate([
    (0, common_1.Patch)('goals/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update progress or details of goal' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], GoalsController.prototype, "updateGoal", null);
__decorate([
    (0, common_1.Delete)('goals/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete specific goal' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], GoalsController.prototype, "deleteGoal", null);
exports.GoalsController = GoalsController = __decorate([
    (0, swagger_1.ApiTags)('Goals'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(clerk_auth_guard_1.ClerkAuthGuard),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [goals_service_1.GoalsService])
], GoalsController);
//# sourceMappingURL=goals.controller.js.map
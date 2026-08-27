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
exports.ActionItemsController = void 0;
const common_1 = require("@nestjs/common");
const action_items_service_1 = require("./action-items.service");
const create_action_item_dto_1 = require("./dto/create-action-item.dto");
const clerk_auth_guard_1 = require("../auth/clerk-auth.guard");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const swagger_1 = require("@nestjs/swagger");
let ActionItemsController = class ActionItemsController {
    constructor(actionItemsService) {
        this.actionItemsService = actionItemsService;
    }
    async getActionItems(mentorshipId, user) {
        const list = await this.actionItemsService.findActionItemsForMentorship(mentorshipId, user.id);
        return { success: true, data: list };
    }
    async createActionItem(mentorshipId, user, dto) {
        const item = await this.actionItemsService.createActionItem(mentorshipId, user.id, dto);
        return { success: true, data: item };
    }
    async updateActionItem(id, user, dto) {
        const updated = await this.actionItemsService.updateActionItem(id, user.id, dto);
        return { success: true, data: updated };
    }
};
exports.ActionItemsController = ActionItemsController;
__decorate([
    (0, common_1.Get)('mentorships/:id/action-items'),
    (0, swagger_1.ApiOperation)({ summary: 'Get action items for a mentorship relationship' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ActionItemsController.prototype, "getActionItems", null);
__decorate([
    (0, common_1.Post)('mentorships/:id/action-items'),
    (0, swagger_1.ApiOperation)({ summary: 'Create action item for a mentorship relationship' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, create_action_item_dto_1.CreateActionItemDto]),
    __metadata("design:returntype", Promise)
], ActionItemsController.prototype, "createActionItem", null);
__decorate([
    (0, common_1.Patch)('action-items/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update action item status or details' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ActionItemsController.prototype, "updateActionItem", null);
exports.ActionItemsController = ActionItemsController = __decorate([
    (0, swagger_1.ApiTags)('Action Items'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(clerk_auth_guard_1.ClerkAuthGuard),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [action_items_service_1.ActionItemsService])
], ActionItemsController);
//# sourceMappingURL=action-items.controller.js.map
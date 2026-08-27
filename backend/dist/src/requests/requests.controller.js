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
exports.RequestsController = void 0;
const common_1 = require("@nestjs/common");
const requests_service_1 = require("./requests.service");
const create_request_dto_1 = require("./dto/create-request.dto");
const clerk_auth_guard_1 = require("../auth/clerk-auth.guard");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const swagger_1 = require("@nestjs/swagger");
let RequestsController = class RequestsController {
    constructor(requestsService) {
        this.requestsService = requestsService;
    }
    async create(user, dto) {
        const request = await this.requestsService.create(user.id, dto);
        return { success: true, data: request };
    }
    async getAll(user) {
        const list = await this.requestsService.findAll(user.id, user.role);
        return { success: true, data: list };
    }
    async getOne(id, user) {
        const request = await this.requestsService.findOne(id, user.id);
        return { success: true, data: request };
    }
    async accept(id, user) {
        const mentorship = await this.requestsService.accept(id, user.id);
        return { success: true, data: mentorship };
    }
    async decline(id, user) {
        const declined = await this.requestsService.decline(id, user.id);
        return { success: true, data: declined };
    }
    async cancel(id, user) {
        const cancelled = await this.requestsService.cancel(id, user.id);
        return { success: true, data: cancelled };
    }
};
exports.RequestsController = RequestsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Send a new mentorship request (Student)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_request_dto_1.CreateRequestDto]),
    __metadata("design:returntype", Promise)
], RequestsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all requests related to current user (Student or Mentor)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RequestsController.prototype, "getAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get details of specific request' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RequestsController.prototype, "getOne", null);
__decorate([
    (0, common_1.Post)(':id/accept'),
    (0, swagger_1.ApiOperation)({ summary: 'Accept mentorship request (Mentor)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RequestsController.prototype, "accept", null);
__decorate([
    (0, common_1.Post)(':id/decline'),
    (0, swagger_1.ApiOperation)({ summary: 'Decline mentorship request (Mentor)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RequestsController.prototype, "decline", null);
__decorate([
    (0, common_1.Post)(':id/cancel'),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel sent mentorship request (Student)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RequestsController.prototype, "cancel", null);
exports.RequestsController = RequestsController = __decorate([
    (0, swagger_1.ApiTags)('Mentorship Requests'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(clerk_auth_guard_1.ClerkAuthGuard),
    (0, common_1.Controller)('requests'),
    __metadata("design:paramtypes", [requests_service_1.RequestsService])
], RequestsController);
//# sourceMappingURL=requests.controller.js.map
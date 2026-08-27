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
exports.VerificationController = void 0;
const common_1 = require("@nestjs/common");
const verification_service_1 = require("./verification.service");
const submit_verification_dto_1 = require("./dto/submit-verification.dto");
const reject_verification_dto_1 = require("./dto/reject-verification.dto");
const request_changes_dto_1 = require("./dto/request-changes.dto");
const clerk_auth_guard_1 = require("../auth/clerk-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const user_schema_1 = require("../database/schemas/user.schema");
const swagger_1 = require("@nestjs/swagger");
let VerificationController = class VerificationController {
    constructor(verificationService) {
        this.verificationService = verificationService;
    }
    async submit(user, dto) {
        const verification = await this.verificationService.submit(user.id, dto);
        return { success: true, data: verification };
    }
    async getAll() {
        const list = await this.verificationService.findAll();
        return { success: true, data: list };
    }
    async getOne(id) {
        const v = await this.verificationService.findOne(id);
        return { success: true, data: v };
    }
    async approve(id, reviewer) {
        const approved = await this.verificationService.approve(id, reviewer.id);
        return { success: true, data: approved };
    }
    async reject(id, reviewer, dto) {
        const rejected = await this.verificationService.reject(id, reviewer.id, dto.rejectionReason);
        return { success: true, data: rejected };
    }
    async requestChanges(id, reviewer, dto) {
        const changes = await this.verificationService.requestChanges(id, reviewer.id, dto.explanation);
        return { success: true, data: changes };
    }
    async sendOtp(user, body, ip) {
        const data = await this.verificationService.sendOtp(user.id, body.countryCode, body.phoneNumber, ip);
        return { success: true, data };
    }
    async resendOtp(user, ip) {
        const data = await this.verificationService.resendOtp(user.id, ip);
        return { success: true, data };
    }
    async verifyOtp(user, body) {
        const data = await this.verificationService.verifyOtp(user.id, body.otp);
        return { success: true, data };
    }
    async getStatus(user) {
        const data = await this.verificationService.getPhoneVerificationStatus(user.id);
        return { success: true, data };
    }
    async verifyWidgetToken(user, body) {
        if (!body?.token) {
            return { success: false, message: 'token is required.' };
        }
        const data = await this.verificationService.verifyWidgetToken(user.id, body.token);
        return { success: true, data };
    }
};
exports.VerificationController = VerificationController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Submit alumni verification documents (Mentors)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, submit_verification_dto_1.SubmitVerificationDto]),
    __metadata("design:returntype", Promise)
], VerificationController.prototype, "submit", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(user_schema_1.Role.ADMIN, user_schema_1.Role.ALUMNI_OFFICER),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get all verification requests (Admins/Officers)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], VerificationController.prototype, "getAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(user_schema_1.Role.ADMIN, user_schema_1.Role.ALUMNI_OFFICER),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get details of specific verification request' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], VerificationController.prototype, "getOne", null);
__decorate([
    (0, common_1.Patch)(':id/approve'),
    (0, roles_decorator_1.Roles)(user_schema_1.Role.ADMIN, user_schema_1.Role.ALUMNI_OFFICER),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Approve alumni verification request' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], VerificationController.prototype, "approve", null);
__decorate([
    (0, common_1.Patch)(':id/reject'),
    (0, roles_decorator_1.Roles)(user_schema_1.Role.ADMIN, user_schema_1.Role.ALUMNI_OFFICER),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Reject alumni verification request' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, reject_verification_dto_1.RejectVerificationDto]),
    __metadata("design:returntype", Promise)
], VerificationController.prototype, "reject", null);
__decorate([
    (0, common_1.Patch)(':id/request-changes'),
    (0, roles_decorator_1.Roles)(user_schema_1.Role.ADMIN, user_schema_1.Role.ALUMNI_OFFICER),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Request changes on verification details' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, request_changes_dto_1.RequestChangesDto]),
    __metadata("design:returntype", Promise)
], VerificationController.prototype, "requestChanges", null);
__decorate([
    (0, common_1.Post)('phone/send-otp'),
    (0, swagger_1.ApiOperation)({ summary: 'Send OTP verification code to phone number' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], VerificationController.prototype, "sendOtp", null);
__decorate([
    (0, common_1.Post)('phone/resend-otp'),
    (0, swagger_1.ApiOperation)({ summary: 'Resend OTP verification code to phone number' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], VerificationController.prototype, "resendOtp", null);
__decorate([
    (0, common_1.Post)('phone/verify-otp'),
    (0, swagger_1.ApiOperation)({ summary: 'Verify OTP code' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], VerificationController.prototype, "verifyOtp", null);
__decorate([
    (0, common_1.Get)('phone/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Get phone verification status' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], VerificationController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Post)('phone/verify-widget-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Verify MSG91 widget token returned by otp-provider.js success callback' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], VerificationController.prototype, "verifyWidgetToken", null);
exports.VerificationController = VerificationController = __decorate([
    (0, swagger_1.ApiTags)('Alumni Verification'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(clerk_auth_guard_1.ClerkAuthGuard),
    (0, common_1.Controller)('verification'),
    __metadata("design:paramtypes", [verification_service_1.VerificationService])
], VerificationController);
//# sourceMappingURL=verification.controller.js.map
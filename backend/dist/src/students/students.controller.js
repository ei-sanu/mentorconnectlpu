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
exports.StudentsController = void 0;
const common_1 = require("@nestjs/common");
const students_service_1 = require("./students.service");
const clerk_auth_guard_1 = require("../auth/clerk-auth.guard");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const update_student_profile_dto_1 = require("./dto/update-student-profile.dto");
const update_student_career_dto_1 = require("./dto/update-student-career.dto");
const swagger_1 = require("@nestjs/swagger");
let StudentsController = class StudentsController {
    constructor(studentsService) {
        this.studentsService = studentsService;
    }
    async getMyProfile(user) {
        const profile = await this.studentsService.getProfileByUserId(user.id);
        return { success: true, data: profile };
    }
    async updateMyProfile(user, dto) {
        const updated = await this.studentsService.updateProfile(user.id, dto);
        return { success: true, data: updated };
    }
    async updateMyCareer(user, dto) {
        const updated = await this.studentsService.updateCareer(user.id, dto);
        return { success: true, data: updated };
    }
};
exports.StudentsController = StudentsController;
__decorate([
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current student profile' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Student profile object.' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StudentsController.prototype, "getMyProfile", null);
__decorate([
    (0, common_1.Patch)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Update current student profile' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Updated student profile.' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_student_profile_dto_1.UpdateStudentProfileDto]),
    __metadata("design:returntype", Promise)
], StudentsController.prototype, "updateMyProfile", null);
__decorate([
    (0, common_1.Patch)('me/career'),
    (0, swagger_1.ApiOperation)({ summary: 'Update student career settings' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Updated student profile with career details.' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_student_career_dto_1.UpdateStudentCareerDto]),
    __metadata("design:returntype", Promise)
], StudentsController.prototype, "updateMyCareer", null);
exports.StudentsController = StudentsController = __decorate([
    (0, swagger_1.ApiTags)('Students'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(clerk_auth_guard_1.ClerkAuthGuard),
    (0, common_1.Controller)('students'),
    __metadata("design:paramtypes", [students_service_1.StudentsService])
], StudentsController);
//# sourceMappingURL=students.controller.js.map
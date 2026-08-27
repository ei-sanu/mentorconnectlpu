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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("../database/schemas/user.schema");
const mentor_profile_schema_1 = require("../database/schemas/mentor-profile.schema");
const student_profile_schema_1 = require("../database/schemas/student-profile.schema");
const alumni_verification_schema_1 = require("../database/schemas/alumni-verification.schema");
const system_config_schema_1 = require("../database/schemas/system-config.schema");
const audit_service_1 = require("../audit/audit.service");
const analytics_service_1 = require("../analytics/analytics.service");
const clerk_auth_guard_1 = require("../auth/clerk-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const swagger_1 = require("@nestjs/swagger");
let AdminController = class AdminController {
    constructor(userModel, mentorProfileModel, studentProfileModel, verificationModel, configModel, audit, analytics) {
        this.userModel = userModel;
        this.mentorProfileModel = mentorProfileModel;
        this.studentProfileModel = studentProfileModel;
        this.verificationModel = verificationModel;
        this.configModel = configModel;
        this.audit = audit;
        this.analytics = analytics;
    }
    async getDashboard() {
        const stats = await this.analytics.getAdminDashboardMetrics();
        return { success: true, data: stats };
    }
    async getUsers() {
        const users = await this.userModel.find().sort({ createdAt: -1 }).lean();
        return {
            success: true,
            data: users.map((u) => ({ ...u, id: u._id.toString() })),
        };
    }
    async getMentors() {
        const mentors = await this.mentorProfileModel
            .find()
            .populate('userId')
            .sort({ createdAt: -1 })
            .lean();
        return {
            success: true,
            data: mentors.map((m) => ({
                ...m,
                id: m._id.toString(),
                user: m.userId ? { ...m.userId, id: m.userId._id?.toString() } : null,
            })),
        };
    }
    async getStudents() {
        const students = await this.studentProfileModel
            .find()
            .populate('userId')
            .sort({ createdAt: -1 })
            .lean();
        return {
            success: true,
            data: students.map((s) => ({
                ...s,
                id: s._id.toString(),
                user: s.userId ? { ...s.userId, id: s.userId._id?.toString() } : null,
            })),
        };
    }
    async getVerifications() {
        const verifications = await this.verificationModel
            .find()
            .populate({
            path: 'mentorProfileId',
            populate: { path: 'userId' },
        })
            .sort({ createdAt: -1 })
            .lean();
        return {
            success: true,
            data: verifications.map((v) => ({
                ...v,
                id: v._id.toString(),
                mentorProfile: v.mentorProfileId
                    ? {
                        ...v.mentorProfileId,
                        id: v.mentorProfileId._id?.toString(),
                        user: v.mentorProfileId.userId
                            ? {
                                ...v.mentorProfileId.userId,
                                id: v.mentorProfileId.userId._id?.toString(),
                            }
                            : null,
                    }
                    : null,
            })),
        };
    }
    async getAnalytics() {
        const stats = await this.analytics.getAdminDashboardMetrics();
        return { success: true, data: stats };
    }
    async getMatchingConfig() {
        const config = await this.configModel.findOne({ key: 'MATCHING_WEIGHTS' }).lean();
        if (config) {
            return { success: true, data: config.value };
        }
        return {
            success: true,
            data: {
                semanticSimilarity: 35,
                careerGoal: 20,
                expertise: 15,
                industry: 10,
                targetRole: 10,
                availability: 10,
            },
        };
    }
    async updateMatchingConfig(admin, dto) {
        const sum = (dto.semanticSimilarity || 0) +
            (dto.careerGoal || 0) +
            (dto.expertise || 0) +
            (dto.industry || 0) +
            (dto.targetRole || 0) +
            (dto.availability || 0);
        if (sum !== 100) {
            throw new common_1.BadRequestException(`Matching configuration weights must total exactly 100. Current total: ${sum}`);
        }
        const config = await this.configModel.findOneAndUpdate({ key: 'MATCHING_WEIGHTS' }, { $set: { value: dto } }, { upsert: true, new: true }).lean();
        await this.audit.log(admin.id, 'UPDATE_MATCHING_CONFIG', 'SystemConfig', 'MATCHING_WEIGHTS', dto);
        return { success: true, data: config.value };
    }
    async getUserGrowth(days) {
        const period = days ? parseInt(days, 10) : 30;
        const growth = await this.analytics.getUserGrowth(period);
        return { success: true, data: growth };
    }
    async getVerificationOverview() {
        const overview = await this.analytics.getVerificationOverview();
        return { success: true, data: overview };
    }
    async getMentorshipOverview() {
        const overview = await this.analytics.getMentorshipOverview();
        return { success: true, data: overview };
    }
    async getMentorUtilization() {
        const utilization = await this.analytics.getMentorUtilization();
        return { success: true, data: utilization };
    }
    async getMatchingOverview() {
        const overview = await this.analytics.getMatchingOverview();
        return { success: true, data: overview };
    }
    async getTopSkills() {
        const skills = await this.analytics.getTopSkills();
        return { success: true, data: skills };
    }
    async getTopIndustries() {
        const industries = await this.analytics.getTopIndustries();
        return { success: true, data: industries };
    }
    async getAuditLogs(limit) {
        const size = limit ? parseInt(limit, 10) : 50;
        const logs = await this.audit.findAll(size);
        return { success: true, data: logs };
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, swagger_1.ApiOperation)({ summary: 'Admin overview dashboard statistics' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('users'),
    (0, swagger_1.ApiOperation)({ summary: 'List all registered platform users' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUsers", null);
__decorate([
    (0, common_1.Get)('mentors'),
    (0, swagger_1.ApiOperation)({ summary: 'List all mentor profiles' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getMentors", null);
__decorate([
    (0, common_1.Get)('students'),
    (0, swagger_1.ApiOperation)({ summary: 'List all student profiles' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getStudents", null);
__decorate([
    (0, common_1.Get)('verification'),
    (0, swagger_1.ApiOperation)({ summary: 'List all alumni verification requests' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getVerifications", null);
__decorate([
    (0, common_1.Get)('analytics'),
    (0, swagger_1.ApiOperation)({ summary: 'Get detailed system analytics' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAnalytics", null);
__decorate([
    (0, common_1.Get)('matching/config'),
    (0, swagger_1.ApiOperation)({ summary: 'Read central AI matching weights config' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getMatchingConfig", null);
__decorate([
    (0, common_1.Patch)('matching/config'),
    (0, swagger_1.ApiOperation)({ summary: 'Modify central AI matching weights config' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateMatchingConfig", null);
__decorate([
    (0, common_1.Get)('user-growth'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user growth analytics grouped by date' }),
    __param(0, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUserGrowth", null);
__decorate([
    (0, common_1.Get)('verification-overview'),
    (0, swagger_1.ApiOperation)({ summary: 'Get summary status counts for students and mentors' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getVerificationOverview", null);
__decorate([
    (0, common_1.Get)('mentorship-overview'),
    (0, swagger_1.ApiOperation)({ summary: 'Get counts of active, completed, and paused mentorships' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getMentorshipOverview", null);
__decorate([
    (0, common_1.Get)('mentor-utilization'),
    (0, swagger_1.ApiOperation)({ summary: 'Get mentee capacity and utilization statistics' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getMentorUtilization", null);
__decorate([
    (0, common_1.Get)('matching-overview'),
    (0, swagger_1.ApiOperation)({ summary: 'Get AI recommendation and match statistics' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getMatchingOverview", null);
__decorate([
    (0, common_1.Get)('top-skills'),
    (0, swagger_1.ApiOperation)({ summary: 'Get top requested student skills and mentor expertise' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getTopSkills", null);
__decorate([
    (0, common_1.Get)('top-industries'),
    (0, swagger_1.ApiOperation)({ summary: 'Get top student target industries and mentor industries' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getTopIndustries", null);
__decorate([
    (0, common_1.Get)('audit-logs'),
    (0, swagger_1.ApiOperation)({ summary: 'Get recent platform audit logs' }),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAuditLogs", null);
exports.AdminController = AdminController = __decorate([
    (0, swagger_1.ApiTags)('Admin Console'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(clerk_auth_guard_1.ClerkAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_schema_1.Role.ADMIN),
    (0, common_1.Controller)('admin'),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(1, (0, mongoose_1.InjectModel)(mentor_profile_schema_1.MentorProfile.name)),
    __param(2, (0, mongoose_1.InjectModel)(student_profile_schema_1.StudentProfile.name)),
    __param(3, (0, mongoose_1.InjectModel)(alumni_verification_schema_1.AlumniVerification.name)),
    __param(4, (0, mongoose_1.InjectModel)(system_config_schema_1.SystemConfig.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        audit_service_1.AuditService,
        analytics_service_1.AnalyticsService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map
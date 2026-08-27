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
exports.AlumniOfficerController = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const analytics_service_1 = require("../analytics/analytics.service");
const clerk_auth_guard_1 = require("../auth/clerk-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const swagger_1 = require("@nestjs/swagger");
const alumni_verification_schema_1 = require("../database/schemas/alumni-verification.schema");
const mentor_profile_schema_1 = require("../database/schemas/mentor-profile.schema");
const user_schema_1 = require("../database/schemas/user.schema");
let AlumniOfficerController = class AlumniOfficerController {
    constructor(analyticsService, verificationModel, mentorProfileModel) {
        this.analyticsService = analyticsService;
        this.verificationModel = verificationModel;
        this.mentorProfileModel = mentorProfileModel;
    }
    async getDashboard() {
        const data = await this.analyticsService.getAlumniOfficerDashboard();
        return { success: true, data };
    }
    async getVerifications(page = '1', limit = '10', status, q) {
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
        const validStatuses = Object.values(mentor_profile_schema_1.VerificationStatus);
        const statusFilter = status && validStatuses.includes(status) ? status : undefined;
        const mentorProfiles = this.mentorProfileModel.collection.name;
        const users = this.verificationModel.db.model('User').collection.name;
        const pipeline = [
            {
                $lookup: {
                    from: mentorProfiles,
                    localField: 'mentorProfileId',
                    foreignField: '_id',
                    as: 'mp',
                },
            },
            { $unwind: { path: '$mp', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: users,
                    localField: 'mp.userId',
                    foreignField: '_id',
                    as: 'u',
                },
            },
            { $unwind: { path: '$u', preserveNullAndEmptyArrays: true } },
        ];
        if (statusFilter) {
            pipeline.push({ $match: { status: statusFilter } });
        }
        if (q && q.trim()) {
            const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            pipeline.push({
                $match: {
                    $or: [
                        { 'u.firstName': rx },
                        { 'u.lastName': rx },
                        { 'u.email': rx },
                        { 'mp.currentCompany': rx },
                        { 'mp.currentDesignation': rx },
                    ],
                },
            });
        }
        pipeline.push({ $sort: { createdAt: -1 } });
        const [result] = await this.verificationModel.aggregate([
            ...pipeline,
            {
                $facet: {
                    items: [
                        { $skip: (pageNum - 1) * limitNum },
                        { $limit: limitNum },
                        {
                            $project: {
                                _id: 1,
                                status: 1,
                                createdAt: 1,
                                updatedAt: 1,
                                mentorName: {
                                    $trim: { input: { $concat: ['$u.firstName', ' ', '$u.lastName'] } },
                                },
                                email: '$u.email',
                                company: { $ifNull: ['$mp.currentCompany', '—'] },
                                designation: { $ifNull: ['$mp.currentDesignation', '—'] },
                                programme: { $ifNull: ['$mp.programme', '—'] },
                                graduationYear: '$mp.graduationYear',
                            },
                        },
                    ],
                    total: [{ $count: 'count' }],
                },
            },
        ]);
        const statusCounts = await this.verificationModel.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]);
        const countsByStatus = {};
        for (const row of statusCounts)
            countsByStatus[row._id] = row.count;
        return {
            success: true,
            data: result.items.map((i) => ({ ...i, id: i._id.toString(), _id: undefined })),
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: result.total[0]?.count ?? 0,
                totalPages: Math.ceil((result.total[0]?.count ?? 0) / limitNum),
            },
            statusCounts: countsByStatus,
        };
    }
    async getMentors(page = '1', limit = '10', q) {
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
        const users = this.mentorProfileModel.db.model('User').collection.name;
        const matchStage = [];
        if (q && q.trim()) {
            const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            matchStage.push({
                $match: {
                    $or: [
                        { 'u.firstName': rx },
                        { 'u.lastName': rx },
                        { 'u.email': rx },
                        { '$mp.currentCompany': rx },
                        { currentCompany: rx },
                        { industry: rx },
                        { currentDesignation: rx },
                    ],
                },
            });
        }
        const [result] = await this.mentorProfileModel.aggregate([
            {
                $lookup: {
                    from: users,
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'u',
                },
            },
            { $unwind: { path: '$u', preserveNullAndEmptyArrays: true } },
            ...matchStage,
            { $sort: { createdAt: -1 } },
            {
                $facet: {
                    items: [
                        { $skip: (pageNum - 1) * limitNum },
                        { $limit: limitNum },
                        {
                            $project: {
                                _id: 1,
                                mentorName: {
                                    $trim: { input: { $concat: ['$u.firstName', ' ', '$u.lastName'] } },
                                },
                                email: '$u.email',
                                currentCompany: 1,
                                currentDesignation: 1,
                                industry: 1,
                                yearsOfExperience: 1,
                                verificationStatus: 1,
                                acceptingMentees: 1,
                                maxCapacity: 1,
                                currentMenteesCount: 1,
                                graduationYear: 1,
                                createdAt: 1,
                            },
                        },
                    ],
                    total: [{ $count: 'count' }],
                },
            },
        ]);
        return {
            success: true,
            data: result.items.map((i) => ({ ...i, id: i._id.toString() })),
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: result.total[0]?.count ?? 0,
                totalPages: Math.ceil((result.total[0]?.count ?? 0) / limitNum),
            },
        };
    }
};
exports.AlumniOfficerController = AlumniOfficerController;
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, swagger_1.ApiOperation)({ summary: 'Alumni officer overview metrics (real aggregates)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AlumniOfficerController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('verifications'),
    (0, swagger_1.ApiOperation)({ summary: 'List alumni verifications (paginated, searchable)' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], AlumniOfficerController.prototype, "getVerifications", null);
__decorate([
    (0, common_1.Get)('mentors'),
    (0, swagger_1.ApiOperation)({ summary: 'List alumni mentors (paginated, searchable)' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], AlumniOfficerController.prototype, "getMentors", null);
exports.AlumniOfficerController = AlumniOfficerController = __decorate([
    (0, swagger_1.ApiTags)('Alumni Officer'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(clerk_auth_guard_1.ClerkAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_schema_1.Role.ALUMNI_OFFICER, user_schema_1.Role.ADMIN),
    (0, common_1.Controller)('alumni-officer'),
    __param(1, (0, mongoose_1.InjectModel)(alumni_verification_schema_1.AlumniVerification.name)),
    __param(2, (0, mongoose_1.InjectModel)(mentor_profile_schema_1.MentorProfile.name)),
    __metadata("design:paramtypes", [analytics_service_1.AnalyticsService,
        mongoose_2.Model,
        mongoose_2.Model])
], AlumniOfficerController);
//# sourceMappingURL=alumni-officer.controller.js.map
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
exports.PlacementOfficerController = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const analytics_service_1 = require("../analytics/analytics.service");
const clerk_auth_guard_1 = require("../auth/clerk-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const swagger_1 = require("@nestjs/swagger");
const student_profile_schema_1 = require("../database/schemas/student-profile.schema");
const user_schema_1 = require("../database/schemas/user.schema");
const opportunity_schema_1 = require("../database/schemas/opportunity.schema");
const placement_application_schema_1 = require("../database/schemas/placement-application.schema");
const event_bus_1 = require("../common/event-bus");
let PlacementOfficerController = class PlacementOfficerController {
    constructor(analyticsService, studentProfileModel, opportunityModel, placementApplicationModel) {
        this.analyticsService = analyticsService;
        this.studentProfileModel = studentProfileModel;
        this.opportunityModel = opportunityModel;
        this.placementApplicationModel = placementApplicationModel;
    }
    async getDashboard() {
        const data = await this.analyticsService.getPlacementOfficerDashboard();
        return { success: true, data };
    }
    async getStudents(page = '1', limit = '10', q, industry) {
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
        const users = this.studentProfileModel.db.model('User').collection.name;
        const matchStage = [];
        if (industry && industry.trim()) {
            matchStage.push({ $match: { targetIndustry: industry.trim() } });
        }
        if (q && q.trim()) {
            const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            matchStage.push({
                $match: {
                    $or: [
                        { 'u.firstName': rx },
                        { 'u.lastName': rx },
                        { 'u.email': rx },
                        { targetRole: rx },
                        { targetIndustry: rx },
                        { currentSkills: rx },
                    ],
                },
            });
        }
        const [result] = await this.studentProfileModel.aggregate([
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
                                studentName: {
                                    $trim: { input: { $concat: ['$u.firstName', ' ', '$u.lastName'] } },
                                },
                                programme: 1,
                                school: 1,
                                yearOfStudy: 1,
                                graduationYear: 1,
                                targetRole: 1,
                                targetIndustry: 1,
                                currentSkills: 1,
                                profileCompletion: 1,
                                preferredFrequency: 1,
                                createdAt: 1,
                                onboardingStatus: {
                                    $cond: [
                                        { $eq: ['$u.verificationStatus', 'VERIFIED'] },
                                        'APPROVED',
                                        {
                                            $cond: [
                                                { $eq: ['$u.verificationStatus', 'UNDER_REVIEW'] },
                                                'UNDER_REVIEW',
                                                {
                                                    $cond: [
                                                        { $eq: ['$u.verificationStatus', 'REJECTED'] },
                                                        'REJECTED',
                                                        'CHANGES_REQUESTED'
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                },
                            },
                        },
                    ],
                    total: [{ $count: 'count' }],
                },
            },
        ]);
        const industries = await this.studentProfileModel.aggregate([
            { $match: { targetIndustry: { $ne: '' } } },
            { $group: { _id: '$targetIndustry', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 15 },
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
            industryFilters: industries.map((i) => ({ industry: i._id, count: i.count })),
        };
    }
    async getOpportunities(page = '1', limit = '10', status) {
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
        const filter = {};
        if (status) {
            filter.status = status;
        }
        const [items, total] = await Promise.all([
            this.opportunityModel.find(filter)
                .sort({ createdAt: -1 })
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum)
                .lean(),
            this.opportunityModel.countDocuments(filter),
        ]);
        return {
            success: true,
            data: items.map((i) => ({ ...i, id: i._id.toString() })),
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        };
    }
    async createOpportunity(body) {
        const opp = new this.opportunityModel(body);
        await opp.save();
        event_bus_1.globalEventBus.emit('dashboard_update', { type: 'OPPORTUNITY_CREATED' });
        return { success: true, data: opp };
    }
    async getApplications(page = '1', limit = '10') {
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
        const pipeline = [
            {
                $lookup: {
                    from: 'users',
                    localField: 'studentId',
                    foreignField: '_id',
                    as: 'student',
                },
            },
            { $unwind: '$student' },
            {
                $lookup: {
                    from: 'opportunities',
                    localField: 'opportunityId',
                    foreignField: '_id',
                    as: 'opportunity',
                },
            },
            { $unwind: '$opportunity' },
            { $sort: { createdAt: -1 } },
            {
                $facet: {
                    items: [
                        { $skip: (pageNum - 1) * limitNum },
                        { $limit: limitNum },
                        {
                            $project: {
                                _id: 1,
                                status: 1,
                                interviewDate: 1,
                                notes: 1,
                                createdAt: 1,
                                studentName: { $concat: ['$student.firstName', ' ', '$student.lastName'] },
                                studentEmail: '$student.email',
                                opportunityTitle: '$opportunity.title',
                                opportunityCompany: '$opportunity.company',
                            },
                        },
                    ],
                    total: [{ $count: 'count' }],
                },
            },
        ];
        const [result] = await this.placementApplicationModel.aggregate(pipeline);
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
    async updateApplication(id, body) {
        const updated = await this.placementApplicationModel.findByIdAndUpdate(id, { $set: body }, { new: true });
        event_bus_1.globalEventBus.emit('dashboard_update', { type: 'APPLICATION_UPDATED' });
        return { success: true, data: updated };
    }
    async getStudentDetail(id) {
        const users = this.studentProfileModel.db.model('User').collection.name;
        const [profile] = await this.studentProfileModel.aggregate([
            { $match: { _id: new mongoose_2.Types.ObjectId(id) } },
            {
                $lookup: {
                    from: users,
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'u',
                },
            },
            { $unwind: '$u' },
            {
                $project: {
                    _id: 1,
                    studentName: { $concat: ['$u.firstName', ' ', '$u.lastName'] },
                    email: '$u.email',
                    programme: 1,
                    school: 1,
                    yearOfStudy: 1,
                    graduationYear: 1,
                    currentSkills: 1,
                    targetRole: 1,
                    targetIndustry: 1,
                    careerGoals: 1,
                    interests: 1,
                    mentoringNeeds: 1,
                    profileCompletion: 1,
                    createdAt: 1,
                },
            },
        ]);
        if (!profile) {
            return { success: false, message: 'Student profile not found.' };
        }
        return { success: true, data: profile };
    }
};
exports.PlacementOfficerController = PlacementOfficerController;
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, swagger_1.ApiOperation)({ summary: 'Placement officer overview metrics (real aggregates)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PlacementOfficerController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('students'),
    (0, swagger_1.ApiOperation)({ summary: 'List student career profiles (paginated, searchable)' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('q')),
    __param(3, (0, common_1.Query)('industry')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], PlacementOfficerController.prototype, "getStudents", null);
__decorate([
    (0, common_1.Get)('opportunities'),
    (0, swagger_1.ApiOperation)({ summary: 'List all placement opportunities (paginated)' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], PlacementOfficerController.prototype, "getOpportunities", null);
__decorate([
    (0, common_1.Post)('opportunities'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new placement opportunity' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PlacementOfficerController.prototype, "createOpportunity", null);
__decorate([
    (0, common_1.Get)('applications'),
    (0, swagger_1.ApiOperation)({ summary: 'List student placement applications' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PlacementOfficerController.prototype, "getApplications", null);
__decorate([
    (0, common_1.Patch)('applications/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update student application status' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PlacementOfficerController.prototype, "updateApplication", null);
__decorate([
    (0, common_1.Get)('students/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get single student career profile detail' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PlacementOfficerController.prototype, "getStudentDetail", null);
exports.PlacementOfficerController = PlacementOfficerController = __decorate([
    (0, swagger_1.ApiTags)('Placement Officer'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(clerk_auth_guard_1.ClerkAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_schema_1.Role.PLACEMENT_OFFICER, user_schema_1.Role.ADMIN),
    (0, common_1.Controller)('placement-officer'),
    __param(1, (0, mongoose_1.InjectModel)(student_profile_schema_1.StudentProfile.name)),
    __param(2, (0, mongoose_1.InjectModel)(opportunity_schema_1.Opportunity.name)),
    __param(3, (0, mongoose_1.InjectModel)(placement_application_schema_1.PlacementApplication.name)),
    __metadata("design:paramtypes", [analytics_service_1.AnalyticsService,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], PlacementOfficerController);
//# sourceMappingURL=placement-officer.controller.js.map
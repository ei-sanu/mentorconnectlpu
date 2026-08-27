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
exports.StudentsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const student_profile_schema_1 = require("../database/schemas/student-profile.schema");
const user_schema_1 = require("../database/schemas/user.schema");
const jobs_service_1 = require("../jobs/jobs.service");
let StudentsService = class StudentsService {
    constructor(studentProfileModel, userModel, jobsService) {
        this.studentProfileModel = studentProfileModel;
        this.userModel = userModel;
        this.jobsService = jobsService;
    }
    async getProfileByUserId(userId) {
        const profile = await this.studentProfileModel
            .findOne({ userId })
            .populate('userId')
            .lean();
        if (!profile) {
            throw new common_1.NotFoundException(`Student profile not found for user ${userId}`);
        }
        return {
            ...profile,
            id: profile._id.toString(),
            user: {
                ...profile.userId,
                id: profile.userId._id?.toString(),
            },
        };
    }
    async updateProfile(userId, dto) {
        const existing = await this.studentProfileModel.findOne({ userId }).lean();
        let profile;
        if (existing) {
            const completion = this.calculateCompletion({ ...existing, ...dto });
            profile = await this.studentProfileModel
                .findOneAndUpdate({ userId }, { $set: { ...dto, profileCompletion: completion } }, { new: true })
                .lean();
        }
        else {
            const completion = this.calculateCompletion(dto);
            const created = new this.studentProfileModel({
                userId,
                programme: dto.programme || '',
                school: dto.school || '',
                yearOfStudy: dto.yearOfStudy || 1,
                graduationYear: dto.graduationYear || new Date().getFullYear() + 4,
                interests: dto.interests || [],
                mentoringNeeds: dto.mentoringNeeds || '',
                preferredFrequency: dto.preferredFrequency || '',
                targetRole: '',
                targetIndustry: '',
                profileCompletion: completion,
            });
            const saved = await created.save();
            profile = saved.toObject();
        }
        const profileIdStr = profile._id.toString();
        await this.jobsService.queueStudentEmbedding(profileIdStr);
        return {
            ...profile,
            id: profileIdStr,
        };
    }
    async updateCareer(userId, dto) {
        const existing = await this.studentProfileModel.findOne({ userId }).lean();
        let profile;
        if (!existing) {
            const completion = this.calculateCompletion(dto);
            const created = new this.studentProfileModel({
                userId,
                programme: '',
                school: '',
                yearOfStudy: 1,
                graduationYear: new Date().getFullYear() + 4,
                interests: [],
                mentoringNeeds: '',
                preferredFrequency: '',
                careerGoals: dto.careerGoals || [],
                targetRole: dto.targetRole || '',
                targetIndustry: dto.targetIndustry || '',
                currentSkills: dto.currentSkills || [],
                profileCompletion: completion,
            });
            const saved = await created.save();
            profile = saved.toObject();
        }
        else {
            const completion = this.calculateCompletion({ ...existing, ...dto });
            profile = await this.studentProfileModel
                .findOneAndUpdate({ userId }, { $set: { ...dto, profileCompletion: completion } }, { new: true })
                .lean();
        }
        const profileIdStr = profile._id.toString();
        await this.jobsService.queueStudentEmbedding(profileIdStr);
        return {
            ...profile,
            id: profileIdStr,
        };
    }
    calculateCompletion(p) {
        let score = 0;
        if (p.programme)
            score += 10;
        if (p.school)
            score += 10;
        if (p.yearOfStudy)
            score += 10;
        if (p.graduationYear)
            score += 10;
        if (p.interests && p.interests.length > 0)
            score += 15;
        if (p.mentoringNeeds)
            score += 15;
        if (p.targetRole)
            score += 10;
        if (p.targetIndustry)
            score += 10;
        if (p.currentSkills && p.currentSkills.length > 0)
            score += 10;
        return Math.min(score, 100);
    }
};
exports.StudentsService = StudentsService;
exports.StudentsService = StudentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(student_profile_schema_1.StudentProfile.name)),
    __param(1, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => jobs_service_1.JobsService))),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        jobs_service_1.JobsService])
], StudentsService);
//# sourceMappingURL=students.service.js.map
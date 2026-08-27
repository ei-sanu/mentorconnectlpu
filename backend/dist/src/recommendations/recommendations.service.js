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
exports.RecommendationsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const student_profile_schema_1 = require("../database/schemas/student-profile.schema");
const mentor_profile_schema_1 = require("../database/schemas/mentor-profile.schema");
const matching_service_1 = require("../matching/matching.service");
const ioredis_1 = require("ioredis");
let RecommendationsService = class RecommendationsService {
    constructor(studentProfileModel, mentorProfileModel, matchingService) {
        this.studentProfileModel = studentProfileModel;
        this.mentorProfileModel = mentorProfileModel;
        this.matchingService = matchingService;
        this.redis = null;
        try {
            const redisOptions = {};
            if (process.env.REDIS_URL && process.env.REDIS_URL.startsWith('rediss://')) {
                redisOptions.tls = { rejectUnauthorized: false };
            }
            this.redis = process.env.REDIS_URL
                ? new ioredis_1.default(process.env.REDIS_URL, { lazyConnect: true, ...redisOptions })
                : new ioredis_1.default({
                    host: process.env.REDIS_HOST || 'localhost',
                    port: parseInt(process.env.REDIS_PORT || '6379', 10),
                    lazyConnect: true,
                });
            this.redis.connect().catch((err) => {
                console.warn(`Redis connection failed for recommendations caching: ${err.message}`);
                this.redis = null;
            });
        }
        catch (err) {
            console.warn(`Failed to initialize Redis in RecommendationsService: ${err.message}`);
        }
    }
    async getRecommendedMentors(userId) {
        const studentProfile = await this.studentProfileModel.findOne({ userId: new mongoose_2.Types.ObjectId(userId) }).lean();
        if (!studentProfile) {
            const mentors = await this.mentorProfileModel
                .find({
                verificationStatus: mentor_profile_schema_1.VerificationStatus.VERIFIED,
                status: mentor_profile_schema_1.MentorStatus.ACTIVE,
                acceptingMentees: true,
            })
                .populate('userId')
                .limit(5)
                .lean();
            return mentors.map((m) => {
                const user = m.userId || {};
                return {
                    id: m._id.toString(),
                    userId: user._id?.toString() || m.userId?.toString(),
                    firstName: user.firstName || '',
                    lastName: user.lastName || '',
                    imageUrl: user.avatar || `https://picsum.photos/seed/${m._id}/200/200`,
                    title: m.currentDesignation,
                    company: m.currentCompany,
                    experienceYears: m.yearsOfExperience,
                    expertise: m.expertise,
                    industry: m.industry,
                    graduationYear: m.graduationYear.toString(),
                    programme: m.programme,
                    capacity: { max: m.maxCapacity, current: m.currentMenteesCount },
                    acceptingMentees: m.acceptingMentees,
                    matchScore: 80,
                    matchReasons: ['Verified Mentor', 'Alumni of LPU'],
                };
            });
        }
        const studentProfileIdStr = studentProfile._id.toString();
        const cacheKey = `recommendations:student:${studentProfileIdStr}`;
        if (this.redis) {
            try {
                const cached = await this.redis.get(cacheKey);
                if (cached) {
                    return JSON.parse(cached);
                }
            }
            catch (err) {
                console.warn(`Failed to fetch cached recommendations: ${err.message}`);
            }
        }
        const recommendations = await this.matchingService.calculateRecommendation(studentProfileIdStr);
        if (this.redis) {
            try {
                await this.redis.setex(cacheKey, 3600, JSON.stringify(recommendations));
            }
            catch (err) {
                console.warn(`Failed to cache recommendations in Redis: ${err.message}`);
            }
        }
        return recommendations;
    }
    async getMentorMatchDetails(userId, mentorId) {
        const studentProfile = await this.studentProfileModel.findOne({ userId: new mongoose_2.Types.ObjectId(userId) }).lean();
        if (!studentProfile) {
            throw new common_1.NotFoundException('Please complete your student career profile first');
        }
        const matches = await this.matchingService.calculateRecommendation(studentProfile._id.toString(), mentorId);
        if (matches.length === 0) {
            throw new common_1.NotFoundException('Mentor is not eligible or not found');
        }
        return matches[0];
    }
    async invalidateCacheForStudent(studentProfileId) {
        if (this.redis) {
            try {
                await this.redis.del(`recommendations:student:${studentProfileId}`);
            }
            catch (err) {
                console.warn(`Failed to invalidate cache for student ${studentProfileId}: ${err.message}`);
            }
        }
    }
    async invalidateAllCaches() {
        if (this.redis) {
            try {
                const keys = await this.redis.keys('recommendations:student:*');
                if (keys.length > 0) {
                    await this.redis.del(...keys);
                }
            }
            catch (err) {
                console.warn(`Failed to invalidate all caches: ${err.message}`);
            }
        }
    }
};
exports.RecommendationsService = RecommendationsService;
exports.RecommendationsService = RecommendationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(student_profile_schema_1.StudentProfile.name)),
    __param(1, (0, mongoose_1.InjectModel)(mentor_profile_schema_1.MentorProfile.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        matching_service_1.MatchingService])
], RecommendationsService);
//# sourceMappingURL=recommendations.service.js.map
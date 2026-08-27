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
exports.MentorsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const mentor_profile_schema_1 = require("../database/schemas/mentor-profile.schema");
const availability_schema_1 = require("../database/schemas/availability.schema");
const user_schema_1 = require("../database/schemas/user.schema");
const jobs_service_1 = require("../jobs/jobs.service");
let MentorsService = class MentorsService {
    constructor(mentorProfileModel, availabilityModel, userModel, jobsService) {
        this.mentorProfileModel = mentorProfileModel;
        this.availabilityModel = availabilityModel;
        this.userModel = userModel;
        this.jobsService = jobsService;
    }
    async findMany(query, isAdminOrOfficer = false) {
        const { search, skills, industry, role, experienceMin, experienceMax, availability, acceptingMentees, page = 1, limit = 10, sort, } = query;
        const skip = (page - 1) * limit;
        const where = {
            profileVisibility: true,
        };
        if (!isAdminOrOfficer) {
            where.verificationStatus = mentor_profile_schema_1.VerificationStatus.VERIFIED;
            where.status = mentor_profile_schema_1.MentorStatus.ACTIVE;
            where.acceptingMentees = true;
            where.$expr = { $lt: ['$currentMenteesCount', '$maxCapacity'] };
        }
        else {
            if (acceptingMentees !== undefined) {
                where.acceptingMentees = acceptingMentees;
            }
        }
        if (industry) {
            where.industry = { $regex: `^${industry}$`, $options: 'i' };
        }
        if (role) {
            where.currentDesignation = { $regex: role, $options: 'i' };
        }
        if (experienceMin !== undefined || experienceMax !== undefined) {
            where.yearsOfExperience = {};
            if (experienceMin !== undefined)
                where.yearsOfExperience.$gte = experienceMin;
            if (experienceMax !== undefined)
                where.yearsOfExperience.$lte = experienceMax;
        }
        if (skills) {
            const skillsList = skills.split(',').map((s) => s.trim());
            where.expertise = { $in: skillsList };
        }
        if (availability) {
            const dayMapping = {
                sunday: 0,
                monday: 1,
                tuesday: 2,
                wednesday: 3,
                thursday: 4,
                friday: 5,
                saturday: 6,
            };
            const targetDay = dayMapping[availability.toLowerCase()];
            if (targetDay !== undefined) {
                const availMentors = await this.availabilityModel
                    .find({ dayOfWeek: targetDay })
                    .distinct('mentorProfileId');
                where._id = { $in: availMentors };
            }
        }
        if (search) {
            const matchingUsers = await this.userModel
                .find({
                $or: [
                    { firstName: { $regex: search, $options: 'i' } },
                    { lastName: { $regex: search, $options: 'i' } },
                ],
            })
                .distinct('_id');
            const searchConditions = [
                { currentCompany: { $regex: search, $options: 'i' } },
                { currentDesignation: { $regex: search, $options: 'i' } },
                { bio: { $regex: search, $options: 'i' } },
                { expertise: { $in: [search] } },
            ];
            if (matchingUsers.length > 0) {
                searchConditions.push({ userId: { $in: matchingUsers } });
            }
            if (where.$or) {
                where.$and = [{ $or: where.$or }, { $or: searchConditions }];
                delete where.$or;
            }
            else {
                where.$or = searchConditions;
            }
        }
        let sortObj = { createdAt: -1 };
        if (sort) {
            const [field, direction] = sort.split('_');
            const dirValue = direction === 'asc' ? 1 : -1;
            if (field === 'experienceYears') {
                sortObj = { yearsOfExperience: dirValue };
            }
        }
        const total = await this.mentorProfileModel.countDocuments(where);
        const mentors = await this.mentorProfileModel
            .find(where)
            .populate('userId')
            .sort(sortObj)
            .skip(skip)
            .limit(limit)
            .lean();
        const mapped = mentors.map((m) => this.mapToPublicProfile(m));
        return {
            success: true,
            data: mapped,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findOne(id) {
        const mentor = await this.mentorProfileModel
            .findById(id)
            .populate('userId')
            .lean();
        if (!mentor) {
            throw new common_1.NotFoundException(`Mentor with ID ${id} not found`);
        }
        return this.mapToPublicProfile(mentor);
    }
    async getAvailability(id) {
        return this.availabilityModel.find({ mentorProfileId: new mongoose_2.Types.ObjectId(id) }).lean();
    }
    async getProfileByUserId(userId) {
        const profile = await this.mentorProfileModel
            .findOne({ userId })
            .populate('userId')
            .lean();
        if (!profile) {
            throw new common_1.NotFoundException(`Mentor profile not found for user ${userId}`);
        }
        const availabilities = await this.availabilityModel
            .find({ mentorProfileId: profile._id })
            .lean();
        return {
            ...profile,
            id: profile._id.toString(),
            availabilities: availabilities.map((a) => ({ ...a, id: a._id.toString() })),
        };
    }
    async updateProfile(userId, dto) {
        const existing = await this.mentorProfileModel.findOne({ userId }).lean();
        let profile;
        if (existing) {
            profile = await this.mentorProfileModel
                .findOneAndUpdate({ userId }, { $set: dto }, { new: true })
                .lean();
        }
        else {
            const created = new this.mentorProfileModel({
                userId,
                graduationYear: dto.graduationYear || new Date().getFullYear() - 5,
                programme: dto.programme || '',
                currentCompany: dto.currentCompany || '',
                currentDesignation: dto.currentDesignation || '',
                yearsOfExperience: dto.yearsOfExperience || 0,
                industry: dto.industry || '',
                expertise: dto.expertise || [],
                mentoringAreas: dto.mentoringAreas || [],
                bio: dto.bio || '',
                careerSummary: dto.careerSummary || '',
                maxCapacity: dto.maxCapacity || 3,
            });
            const saved = await created.save();
            profile = saved.toObject();
        }
        const profileIdStr = profile._id.toString();
        await this.jobsService.queueMentorEmbedding(profileIdStr);
        return {
            ...profile,
            id: profileIdStr,
        };
    }
    mapToPublicProfile(m) {
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
            capacity: {
                max: m.maxCapacity,
                current: m.currentMenteesCount,
            },
            acceptingMentees: m.acceptingMentees && m.currentMenteesCount < m.maxCapacity,
        };
    }
};
exports.MentorsService = MentorsService;
exports.MentorsService = MentorsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(mentor_profile_schema_1.MentorProfile.name)),
    __param(1, (0, mongoose_1.InjectModel)(availability_schema_1.Availability.name)),
    __param(2, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => jobs_service_1.JobsService))),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        jobs_service_1.JobsService])
], MentorsService);
//# sourceMappingURL=mentors.service.js.map
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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("../database/schemas/user.schema");
const student_profile_schema_1 = require("../database/schemas/student-profile.schema");
const mentor_profile_schema_1 = require("../database/schemas/mentor-profile.schema");
const alumni_verification_schema_1 = require("../database/schemas/alumni-verification.schema");
const notification_schema_1 = require("../database/schemas/notification.schema");
const audit_log_schema_1 = require("../database/schemas/audit-log.schema");
const event_bus_1 = require("../common/event-bus");
let UsersService = class UsersService {
    constructor(userModel, studentProfileModel, mentorProfileModel, verificationModel, notificationModel, auditLogModel) {
        this.userModel = userModel;
        this.studentProfileModel = studentProfileModel;
        this.mentorProfileModel = mentorProfileModel;
        this.verificationModel = verificationModel;
        this.notificationModel = notificationModel;
        this.auditLogModel = auditLogModel;
    }
    async findOne(id) {
        const user = await this.userModel.findById(id).lean();
        if (!user) {
            throw new common_1.NotFoundException(`User with ID ${id} not found`);
        }
        const studentProfile = await this.studentProfileModel.findOne({ userId: id }).lean();
        const mentorProfile = await this.mentorProfileModel.findOne({ userId: id }).lean();
        let profileCompletion = 0;
        if (user.role === 'STUDENT' && studentProfile) {
            let score = 0;
            if (user.firstName && user.lastName && user.phone)
                score += 20;
            if (studentProfile.programme && studentProfile.school && studentProfile.yearOfStudy)
                score += 25;
            if (studentProfile.currentSkills && studentProfile.currentSkills.length > 0 && studentProfile.targetRole)
                score += 20;
            if (studentProfile.preferredFrequency && studentProfile.mentoringNeeds)
                score += 20;
            if (user.onboardingStatus === 'APPROVED' || user.onboardingStatus === 'SUBMITTED' || user.onboardingStatus === 'UNDER_REVIEW')
                score += 15;
            profileCompletion = score;
        }
        else if (user.role === 'MENTOR' && mentorProfile) {
            let score = 0;
            if (user.firstName && user.lastName && user.phone)
                score += 20;
            if (mentorProfile.programme && mentorProfile.graduationYear)
                score += 25;
            if (mentorProfile.currentCompany && mentorProfile.currentDesignation && mentorProfile.yearsOfExperience)
                score += 20;
            if (mentorProfile.expertise && mentorProfile.expertise.length > 0)
                score += 20;
            if (mentorProfile.verificationStatus === 'VERIFIED' || user.onboardingStatus === 'SUBMITTED' || user.onboardingStatus === 'UNDER_REVIEW')
                score += 15;
            profileCompletion = score;
        }
        return {
            ...user,
            id: user._id.toString(),
            studentProfile: studentProfile ? { ...studentProfile, id: studentProfile._id.toString() } : null,
            mentorProfile: mentorProfile ? { ...mentorProfile, id: mentorProfile._id.toString() } : null,
            profileCompletion,
        };
    }
    async findByClerkId(clerkUserId) {
        const user = await this.userModel.findOne({ clerkUserId }).lean();
        if (!user)
            return null;
        const studentProfile = await this.studentProfileModel.findOne({ userId: user._id }).lean();
        const mentorProfile = await this.mentorProfileModel.findOne({ userId: user._id }).lean();
        let profileCompletion = 0;
        if (user.role === 'STUDENT' && studentProfile) {
            let score = 0;
            if (user.firstName && user.lastName && user.phone)
                score += 20;
            if (studentProfile.programme && studentProfile.school && studentProfile.yearOfStudy)
                score += 25;
            if (studentProfile.currentSkills && studentProfile.currentSkills.length > 0 && studentProfile.targetRole)
                score += 20;
            if (studentProfile.preferredFrequency && studentProfile.mentoringNeeds)
                score += 20;
            if (user.onboardingStatus === 'APPROVED' || user.onboardingStatus === 'SUBMITTED' || user.onboardingStatus === 'UNDER_REVIEW')
                score += 15;
            profileCompletion = score;
        }
        else if (user.role === 'MENTOR' && mentorProfile) {
            let score = 0;
            if (user.firstName && user.lastName && user.phone)
                score += 20;
            if (mentorProfile.programme && mentorProfile.graduationYear)
                score += 25;
            if (mentorProfile.currentCompany && mentorProfile.currentDesignation && mentorProfile.yearsOfExperience)
                score += 20;
            if (mentorProfile.expertise && mentorProfile.expertise.length > 0)
                score += 20;
            if (mentorProfile.verificationStatus === 'VERIFIED' || user.onboardingStatus === 'SUBMITTED' || user.onboardingStatus === 'UNDER_REVIEW')
                score += 15;
            profileCompletion = score;
        }
        return {
            ...user,
            id: user._id.toString(),
            studentProfile: studentProfile ? { ...studentProfile, id: studentProfile._id.toString() } : null,
            mentorProfile: mentorProfile ? { ...mentorProfile, id: mentorProfile._id.toString() } : null,
            profileCompletion,
        };
    }
    async update(id, updateUserDto) {
        const updated = await this.userModel
            .findByIdAndUpdate(id, { $set: updateUserDto }, { new: true })
            .lean();
        if (!updated) {
            throw new common_1.NotFoundException(`User with ID ${id} not found`);
        }
        return {
            ...updated,
            id: updated._id.toString(),
        };
    }
    async getUserProfile(user) {
        const userId = user.id || user._id;
        if (user.role === 'STUDENT') {
            const student = await this.studentProfileModel.findOne({ userId }).lean();
            return { role: 'STUDENT', profile: student ? { ...student, id: student._id.toString() } : null };
        }
        else if (user.role === 'MENTOR') {
            const mentor = await this.mentorProfileModel.findOne({ userId }).lean();
            return { role: 'MENTOR', profile: mentor ? { ...mentor, id: mentor._id.toString() } : null };
        }
        return { role: user.role, profile: null };
    }
    async submitOnboarding(userId, data) {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException(`User with ID ${userId} not found`);
        }
        const targetRole = data.role === 'MENTOR' ? user_schema_1.Role.MENTOR : user_schema_1.Role.STUDENT;
        const regNum = data.lpuRegistrationNumber?.trim();
        const normalizedReg = regNum ? regNum.toUpperCase() : null;
        if (normalizedReg) {
            const duplicateUser = await this.userModel.findOne({
                lpuRegistrationNumberNormalized: normalizedReg,
                _id: { $ne: user._id }
            });
            if (duplicateUser) {
                throw new common_1.BadRequestException('This LPU Registration Number is already claimed by another account.');
            }
            user.lpuRegistrationNumber = regNum;
            user.lpuRegistrationNumberNormalized = normalizedReg;
        }
        user.phone = data.phone;
        user.lpuEmail = data.lpuEmail;
        user.role = targetRole;
        user.onboardingStatus = 'UNDER_REVIEW';
        user.verificationStatus = 'PENDING';
        user.firstName = data.firstName || user.firstName;
        user.lastName = data.lastName || user.lastName;
        await user.save();
        if (targetRole === user_schema_1.Role.STUDENT) {
            let student = await this.studentProfileModel.findOne({ userId: user._id });
            if (!student) {
                student = new this.studentProfileModel({ userId: user._id });
            }
            student.programme = data.programme || 'B.Tech';
            student.school = data.school || 'LPU';
            student.yearOfStudy = data.yearOfStudy ? parseInt(data.yearOfStudy, 10) : 1;
            student.graduationYear = data.graduationYear ? parseInt(data.graduationYear, 10) : new Date().getFullYear() + 3;
            student.currentSkills = data.skills || [];
            student.targetRole = data.targetRole || 'Software Engineer';
            student.targetIndustry = data.targetIndustry || 'Technology';
            student.careerGoals = data.careerGoals || [];
            student.interests = data.interests || [];
            student.mentoringNeeds = data.mentoringNeeds || 'Career planning';
            student.preferredFrequency = data.preferredFrequency || 'Weekly';
            student.onboardingStatus = true;
            await student.save();
        }
        else if (targetRole === user_schema_1.Role.MENTOR) {
            let mentor = await this.mentorProfileModel.findOne({ userId: user._id });
            if (!mentor) {
                mentor = new this.mentorProfileModel({ userId: user._id });
            }
            mentor.graduationYear = data.graduationYear ? parseInt(data.graduationYear, 10) : new Date().getFullYear() - 2;
            mentor.programme = data.programme || 'B.Tech';
            mentor.currentCompany = data.currentCompany || 'LPU';
            mentor.currentDesignation = data.currentDesignation || 'Alumnus';
            mentor.yearsOfExperience = data.yearsOfExperience ? parseInt(data.yearsOfExperience, 10) : 1;
            mentor.industry = data.industry || 'Technology';
            mentor.expertise = data.expertise || [];
            mentor.mentoringAreas = data.mentoringAreas || [];
            mentor.bio = data.bio || 'LPU Alumnus';
            mentor.careerSummary = data.careerSummary || 'LPU Alumnus Professional';
            mentor.verificationStatus = mentor_profile_schema_1.VerificationStatus.PENDING;
            mentor.status = mentor_profile_schema_1.MentorStatus.INACTIVE;
            await mentor.save();
            const verification = new this.verificationModel({
                mentorProfileId: mentor._id,
                submittedData: {
                    registrationNumber: regNum,
                    programme: data.programme,
                    school: data.school,
                    graduationYear: data.graduationYear,
                    lpuEmail: data.lpuEmail,
                    proofDocumentUrl: data.proofDocumentUrl || 'https://picsum.photos/200/300',
                },
                status: mentor_profile_schema_1.VerificationStatus.PENDING,
            });
            await verification.save();
        }
        const notificationText = targetRole === user_schema_1.Role.STUDENT
            ? `New student verification submitted by ${user.firstName} ${user.lastName} (${regNum})`
            : `New alumni mentor verification submitted by ${user.firstName} ${user.lastName} (${regNum})`;
        const admins = await this.userModel.find({ role: user_schema_1.Role.ADMIN }).lean();
        for (const admin of admins) {
            const adminNotif = new this.notificationModel({
                userId: admin._id,
                type: 'NEW_ONBOARDING',
                title: 'New Verification Request',
                message: notificationText,
                read: false,
                metadata: { applicantId: user._id.toString(), role: targetRole }
            });
            await adminNotif.save();
        }
        const auditLog = new this.auditLogModel({
            actorId: user._id,
            action: 'ONBOARDING_SUBMITTED',
            entity: 'User',
            entityId: user._id.toString(),
            metadata: { role: targetRole, regNum },
        });
        await auditLog.save();
        event_bus_1.globalEventBus.emit('dashboard_update', {
            type: 'USER_ONBOARDED',
            targetRole: targetRole === user_schema_1.Role.MENTOR ? 'MENTOR' : 'STUDENT',
        });
        return { success: true, onboardingStatus: 'UNDER_REVIEW' };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(1, (0, mongoose_1.InjectModel)(student_profile_schema_1.StudentProfile.name)),
    __param(2, (0, mongoose_1.InjectModel)(mentor_profile_schema_1.MentorProfile.name)),
    __param(3, (0, mongoose_1.InjectModel)(alumni_verification_schema_1.AlumniVerification.name)),
    __param(4, (0, mongoose_1.InjectModel)(notification_schema_1.Notification.name)),
    __param(5, (0, mongoose_1.InjectModel)(audit_log_schema_1.AuditLog.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], UsersService);
//# sourceMappingURL=users.service.js.map
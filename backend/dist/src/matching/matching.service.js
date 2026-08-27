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
var MatchingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchingService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const student_profile_schema_1 = require("../database/schemas/student-profile.schema");
const mentor_profile_schema_1 = require("../database/schemas/mentor-profile.schema");
const availability_schema_1 = require("../database/schemas/availability.schema");
const system_config_schema_1 = require("../database/schemas/system-config.schema");
const genai_1 = require("@google/genai");
function cosineSimilarity(a, b) {
    if (!a || !b || a.length !== b.length)
        return 0.5;
    let dot = 0;
    let mA = 0;
    let mB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        mA += a[i] * a[i];
        mB += b[i] * b[i];
    }
    if (mA === 0 || mB === 0)
        return 0.5;
    return dot / (Math.sqrt(mA) * Math.sqrt(mB));
}
let MatchingService = MatchingService_1 = class MatchingService {
    constructor(studentProfileModel, mentorProfileModel, availabilityModel, configModel) {
        this.studentProfileModel = studentProfileModel;
        this.mentorProfileModel = mentorProfileModel;
        this.availabilityModel = availabilityModel;
        this.configModel = configModel;
        this.logger = new common_1.Logger(MatchingService_1.name);
        this.ai = null;
        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey && apiKey !== 'mock_gemini_key') {
            this.ai = new genai_1.GoogleGenAI({ apiKey });
        }
    }
    async getMatchingWeights() {
        const config = await this.configModel.findOne({ key: 'MATCHING_WEIGHTS' }).lean();
        if (config) {
            return config.value;
        }
        return {
            semanticSimilarity: 35,
            careerGoal: 20,
            expertise: 15,
            industry: 10,
            targetRole: 10,
            availability: 10,
        };
    }
    async generateEmbedding(text) {
        try {
            if (this.ai) {
                const response = await this.ai.models.embedContent({
                    model: 'text-embedding-004',
                    contents: text,
                });
                const values = response.embeddings?.[0]?.values;
                if (values) {
                    if (values.length === 768) {
                        return [...values, ...values];
                    }
                    if (values.length === 1536) {
                        return values;
                    }
                    const target = new Array(1536).fill(0);
                    for (let i = 0; i < Math.min(values.length, 1536); i++) {
                        target[i] = values[i];
                    }
                    return target;
                }
            }
        }
        catch (error) {
            this.logger.error(`AI Embedding generation failed: ${error.message}. Using fallback dummy vector.`);
        }
        const dummy = new Array(1536).fill(0);
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            hash = text.charCodeAt(i) + ((hash << 5) - hash);
        }
        for (let i = 0; i < 1536; i++) {
            dummy[i] = Math.sin(hash + i) * 0.1;
        }
        return dummy;
    }
    async generateAndSaveStudentEmbedding(studentProfileId) {
        const student = await this.studentProfileModel.findById(studentProfileId).lean();
        if (!student)
            return;
        const representation = `
      Programme: ${student.programme}
      School: ${student.school}
      Target Role: ${student.targetRole}
      Target Industry: ${student.targetIndustry}
      Skills: ${student.currentSkills.join(', ')}
      Goals: ${student.careerGoals.join(', ')}
      Needs: ${student.mentoringNeeds}
    `;
        const embedding = await this.generateEmbedding(representation);
        await this.studentProfileModel.findByIdAndUpdate(studentProfileId, {
            $set: { studentEmbedding: embedding },
        });
        this.logger.log(`Generated and stored embedding for StudentProfile: ${studentProfileId}`);
    }
    async generateAndSaveMentorEmbedding(mentorProfileId) {
        const mentor = await this.mentorProfileModel.findById(mentorProfileId).lean();
        if (!mentor)
            return;
        const representation = `
      Programme: ${mentor.programme}
      Designation: ${mentor.currentDesignation}
      Company: ${mentor.currentCompany}
      Industry: ${mentor.industry}
      Expertise: ${mentor.expertise.join(', ')}
      Areas: ${mentor.mentoringAreas.join(', ')}
      Bio: ${mentor.bio}
      Summary: ${mentor.careerSummary}
    `;
        const embedding = await this.generateEmbedding(representation);
        await this.mentorProfileModel.findByIdAndUpdate(mentorProfileId, {
            $set: { mentorEmbedding: embedding },
        });
        this.logger.log(`Generated and stored embedding for MentorProfile: ${mentorProfileId}`);
    }
    async calculateRecommendation(studentProfileId, mentorProfileId) {
        const student = await this.studentProfileModel.findById(studentProfileId).lean();
        if (!student) {
            throw new Error(`Student profile ${studentProfileId} not found`);
        }
        const weights = await this.getMatchingWeights();
        let mentors = [];
        if (mentorProfileId) {
            const single = await this.mentorProfileModel.findById(mentorProfileId).populate('userId').lean();
            if (single)
                mentors = [single];
        }
        else {
            mentors = await this.mentorProfileModel.find({
                verificationStatus: mentor_profile_schema_1.VerificationStatus.VERIFIED,
                status: mentor_profile_schema_1.MentorStatus.ACTIVE,
                acceptingMentees: true,
                profileVisibility: true,
                $expr: { $lt: ['$currentMenteesCount', '$maxCapacity'] },
            }).populate('userId').lean();
        }
        let semanticScores = {};
        let isFallback = false;
        const studentEmb = student.studentEmbedding;
        if (studentEmb && studentEmb.length > 0) {
            try {
                for (const m of mentors) {
                    if (m.mentorEmbedding && m.mentorEmbedding.length > 0) {
                        const similarity = cosineSimilarity(studentEmb, m.mentorEmbedding);
                        const normalized = (similarity + 1) / 2;
                        semanticScores[m._id.toString()] = isNaN(normalized) ? 0.5 : normalized;
                    }
                    else {
                        semanticScores[m._id.toString()] = 0.5;
                    }
                }
            }
            catch (err) {
                this.logger.error(`Vector search logic failed: ${err.message}. Using fallback.`);
                isFallback = true;
            }
        }
        else {
            isFallback = true;
        }
        const recommendations = [];
        for (const m of mentors) {
            const mIdStr = m._id.toString();
            const mAvailabilities = await this.availabilityModel.find({ mentorProfileId: m._id }).lean();
            let careerGoalScore = 0;
            if (student.careerGoals.length > 0 && m.mentoringAreas.length > 0) {
                const intersection = student.careerGoals.filter((g) => m.mentoringAreas.some((a) => a.toLowerCase().includes(g.toLowerCase()) || g.toLowerCase().includes(a.toLowerCase())));
                careerGoalScore = intersection.length / student.careerGoals.length;
            }
            let expertiseScore = 0;
            if (student.currentSkills.length > 0 && m.expertise.length > 0) {
                const intersection = student.currentSkills.filter((s) => m.expertise.some((e) => e.toLowerCase() === s.toLowerCase()));
                expertiseScore = intersection.length / student.currentSkills.length;
            }
            const industryScore = student.targetIndustry.toLowerCase() === m.industry.toLowerCase() ? 1.0 : 0.0;
            const roleScore = m.currentDesignation.toLowerCase().includes(student.targetRole.toLowerCase()) ||
                student.targetRole.toLowerCase().includes(m.currentDesignation.toLowerCase())
                ? 1.0
                : 0.0;
            const availabilityScore = mAvailabilities.length > 0 ? 1.0 : 0.5;
            const semanticScore = semanticScores[mIdStr] !== undefined ? semanticScores[mIdStr] : 0.5;
            const totalWeight = weights.semanticSimilarity +
                weights.careerGoal +
                weights.expertise +
                weights.industry +
                weights.targetRole +
                weights.availability;
            const finalScore = (semanticScore * weights.semanticSimilarity +
                careerGoalScore * weights.careerGoal +
                expertiseScore * weights.expertise +
                industryScore * weights.industry +
                roleScore * weights.targetRole +
                availabilityScore * weights.availability) /
                totalWeight;
            const matchReasons = [];
            if (roleScore > 0)
                matchReasons.push('Matches your target role');
            if (industryScore > 0)
                matchReasons.push(`Relevant experience in ${m.industry}`);
            if (expertiseScore > 0)
                matchReasons.push('Aligns with your skill-development needs');
            if (careerGoalScore > 0)
                matchReasons.push('Matches your primary career goals');
            if (m.yearsOfExperience >= 5)
                matchReasons.push(`Senior mentorship perspective (${m.yearsOfExperience} years of experience)`);
            if (m.currentCompany)
                matchReasons.push(`Currently working at ${m.currentCompany}`);
            if (matchReasons.length < 2) {
                matchReasons.push('Currently accepting mentees');
                matchReasons.push('Alumni of LPU');
            }
            const user = m.userId || {};
            recommendations.push({
                id: mIdStr,
                userId: user._id?.toString() || m.userId?.toString(),
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                imageUrl: user.avatar || `https://picsum.photos/seed/${mIdStr}/200/200`,
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
                matchScore: Math.round(finalScore * 100),
                matchReasons,
                matchType: isFallback ? 'FALLBACK' : 'HYBRID',
            });
        }
        return recommendations.sort((a, b) => b.matchScore - a.matchScore);
    }
};
exports.MatchingService = MatchingService;
exports.MatchingService = MatchingService = MatchingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(student_profile_schema_1.StudentProfile.name)),
    __param(1, (0, mongoose_1.InjectModel)(mentor_profile_schema_1.MentorProfile.name)),
    __param(2, (0, mongoose_1.InjectModel)(availability_schema_1.Availability.name)),
    __param(3, (0, mongoose_1.InjectModel)(system_config_schema_1.SystemConfig.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], MatchingService);
//# sourceMappingURL=matching.service.js.map
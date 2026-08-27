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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("../database/schemas/user.schema");
const mentor_profile_schema_1 = require("../database/schemas/mentor-profile.schema");
const student_profile_schema_1 = require("../database/schemas/student-profile.schema");
const mentorship_schema_1 = require("../database/schemas/mentorship.schema");
const session_schema_1 = require("../database/schemas/session.schema");
const goal_schema_1 = require("../database/schemas/goal.schema");
const feedback_schema_1 = require("../database/schemas/feedback.schema");
const alumni_verification_schema_1 = require("../database/schemas/alumni-verification.schema");
const mentorship_request_schema_1 = require("../database/schemas/mentorship-request.schema");
const opportunity_schema_1 = require("../database/schemas/opportunity.schema");
const placement_application_schema_1 = require("../database/schemas/placement-application.schema");
const ioredis_1 = require("ioredis");
const matching_service_1 = require("../matching/matching.service");
const CACHE_TTL_SECONDS = 30;
let AnalyticsService = class AnalyticsService {
    constructor(userModel, studentProfileModel, mentorProfileModel, verificationModel, mentorshipModel, requestModel, sessionModel, goalModel, feedbackModel, opportunityModel, placementApplicationModel, matchingService) {
        this.userModel = userModel;
        this.studentProfileModel = studentProfileModel;
        this.mentorProfileModel = mentorProfileModel;
        this.verificationModel = verificationModel;
        this.mentorshipModel = mentorshipModel;
        this.requestModel = requestModel;
        this.sessionModel = sessionModel;
        this.goalModel = goalModel;
        this.feedbackModel = feedbackModel;
        this.opportunityModel = opportunityModel;
        this.placementApplicationModel = placementApplicationModel;
        this.matchingService = matchingService;
        this.redis = null;
    }
    getRedis() {
        if (this.redis)
            return this.redis;
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
                    ...redisOptions,
                });
        }
        catch {
            this.redis = null;
        }
        return this.redis;
    }
    async cached(key, compute) {
        const redis = this.getRedis();
        if (redis) {
            try {
                const hit = await redis.get(key);
                if (hit)
                    return JSON.parse(hit);
            }
            catch {
            }
        }
        const value = await compute();
        if (redis) {
            redis.set(key, JSON.stringify(value), 'EX', CACHE_TTL_SECONDS).catch(() => undefined);
        }
        return value;
    }
    lastNMonths(n) {
        const out = [];
        const now = new Date();
        for (let i = n - 1; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            out.push({
                key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
                label: d.toLocaleString('en-US', { month: 'short' }),
                year: d.getFullYear(),
                month: d.getMonth() + 1,
            });
        }
        return out;
    }
    async requestSeries(n = 6) {
        const months = this.lastNMonths(n);
        const start = new Date(months[0].year, months[0].month - 1, 1);
        const rows = await this.requestModel.aggregate([
            { $match: { createdAt: { $gte: start } } },
            {
                $group: {
                    _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } },
                    total: { $sum: 1 },
                    accepted: { $sum: { $cond: [{ $eq: ['$status', mentorship_request_schema_1.RequestStatus.ACCEPTED] }, 1, 0] } },
                },
            },
        ]);
        const map = new Map(rows.map((r) => [`${r._id.y}-${String(r._id.m).padStart(2, '0')}`, r]));
        return months.map((m) => ({
            month: m.label,
            requests: map.get(m.key)?.total ?? 0,
            accepted: map.get(m.key)?.accepted ?? 0,
        }));
    }
    async signupSeries(role, n = 6) {
        const months = this.lastNMonths(n);
        const start = new Date(months[0].year, months[0].month - 1, 1);
        const match = { createdAt: { $gte: start } };
        if (role)
            match.role = role;
        const rows = await this.userModel.aggregate([
            { $match: match },
            {
                $group: {
                    _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } },
                    count: { $sum: 1 },
                },
            },
        ]);
        const map = new Map(rows.map((r) => [`${r._id.y}-${String(r._id.m).padStart(2, '0')}`, r.count]));
        return months.map((m) => ({ month: m.label, signups: map.get(m.key) ?? 0 }));
    }
    async averageSatisfaction() {
        const stats = await this.feedbackModel.aggregate([
            { $group: { _id: null, avgRating: { $avg: '$rating' } } },
        ]);
        return parseFloat((stats[0]?.avgRating || 0).toFixed(1));
    }
    async getAdminDashboardMetrics() {
        return this.cached('dash:admin:v2', () => this.computeAdminMetrics());
    }
    async computeAdminMetrics() {
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        const [totalUsers, totalStudents, totalVerifiedMentors, totalMentorProfiles, mentorPendingVerifications, studentPendingVerifications, activeMentorshipsCount, atRiskMentorshipsCount, pendingRequests, totalRequests, acceptedRequests, declinedRequests, expiredRequests, completedSessionsCount, missedSessionsCount, sessionsThisWeek, completedGoalsCount,] = await Promise.all([
            this.userModel.countDocuments(),
            this.studentProfileModel.countDocuments(),
            this.mentorProfileModel.countDocuments({ verificationStatus: mentor_profile_schema_1.VerificationStatus.VERIFIED }),
            this.mentorProfileModel.countDocuments(),
            this.verificationModel.countDocuments({ status: mentor_profile_schema_1.VerificationStatus.PENDING }),
            this.userModel.countDocuments({ role: user_schema_1.Role.STUDENT, onboardingStatus: 'UNDER_REVIEW' }),
            this.mentorshipModel.countDocuments({ status: 'ACTIVE' }),
            this.mentorshipModel.countDocuments({ status: 'AT_RISK' }),
            this.requestModel.countDocuments({ status: mentorship_request_schema_1.RequestStatus.PENDING }),
            this.requestModel.countDocuments(),
            this.requestModel.countDocuments({ status: mentorship_request_schema_1.RequestStatus.ACCEPTED }),
            this.requestModel.countDocuments({ status: mentorship_request_schema_1.RequestStatus.DECLINED }),
            this.requestModel.countDocuments({ status: mentorship_request_schema_1.RequestStatus.EXPIRED }),
            this.sessionModel.countDocuments({ status: 'COMPLETED' }),
            this.sessionModel.countDocuments({ status: 'NO_SHOW' }),
            this.sessionModel.countDocuments({
                status: 'SCHEDULED',
                scheduledAt: { $gte: new Date(), $lte: weekFromNow },
            }),
            this.goalModel.countDocuments({ status: 'COMPLETED' }),
        ]);
        const [usersByRoleRows, monthlySeries, industries, averageSatisfaction, capacityStats] = await Promise.all([
            this.userModel.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
            this.requestSeries(6),
            this.mentorProfileModel.aggregate([
                { $match: { verificationStatus: mentor_profile_schema_1.VerificationStatus.VERIFIED } },
                { $group: { _id: '$industry', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 8 },
            ]),
            this.averageSatisfaction(),
            this.mentorProfileModel.aggregate([
                { $match: { verificationStatus: mentor_profile_schema_1.VerificationStatus.VERIFIED } },
                {
                    $group: {
                        _id: null,
                        totalCapacity: { $sum: '$maxCapacity' },
                        currentMentees: { $sum: '$currentMenteesCount' },
                    },
                },
            ]),
        ]);
        const totalPendingVerifications = mentorPendingVerifications + studentPendingVerifications;
        const acceptanceRate = totalRequests > 0 ? (acceptedRequests / totalRequests) * 100 : 0;
        const rejectionRate = totalRequests > 0 ? (declinedRequests / totalRequests) * 100 : 0;
        const expiryRate = totalRequests > 0 ? (expiredRequests / totalRequests) * 100 : 0;
        const totalSessions = completedSessionsCount + missedSessionsCount;
        const sessionCompletionRate = totalSessions > 0 ? (completedSessionsCount / totalSessions) * 100 : 0;
        const totalCapacity = capacityStats[0]?.totalCapacity || 0;
        const currentMentees = capacityStats[0]?.currentMentees || 0;
        const mentorUtilization = totalCapacity > 0 ? (currentMentees / totalCapacity) * 100 : 0;
        const recentActivity = await this.buildRecentActivity();
        return {
            overview: {
                totalUsers,
                usersByRole: usersByRoleRows.map((r) => ({ role: r._id || 'UNKNOWN', count: r.count })),
                totalStudents,
                totalVerifiedMentors,
                totalMentorProfiles,
                totalPendingVerifications,
                activeMentorshipsCount,
                atRiskMentorshipsCount,
                pendingRequests,
                sessionsThisWeek,
            },
            requests: {
                totalRequests,
                pendingRequests,
                acceptanceRate: Math.round(acceptanceRate),
                rejectionRate: Math.round(rejectionRate),
                expiryRate: Math.round(expiryRate),
            },
            engagement: {
                completedSessionsCount,
                sessionCompletionRate: Math.round(sessionCompletionRate),
                sessionsThisWeek,
                completedGoalsCount,
                mentorUtilization: Math.round(mentorUtilization),
                averageSatisfaction,
            },
            monthlySeries,
            industries: industries.map((item) => ({
                industry: item._id || 'Unknown',
                count: item.count,
            })),
            recentActivity,
            meta: { generatedAt: new Date().toISOString(), cachedSeconds: CACHE_TTL_SECONDS },
        };
    }
    async buildRecentActivity(limit = 8) {
        const [latestVerifications, latestRequests, latestUsers] = await Promise.all([
            this.verificationModel
                .find()
                .sort({ createdAt: -1 })
                .limit(5)
                .populate({ path: 'mentorProfileId', select: 'currentCompany', populate: { path: 'userId', select: 'firstName lastName' } })
                .lean(),
            this.requestModel
                .find()
                .sort({ createdAt: -1 })
                .limit(5)
                .populate({ path: 'studentId', select: 'firstName lastName' })
                .lean(),
            this.userModel
                .find()
                .sort({ createdAt: -1 })
                .limit(5)
                .select('firstName lastName role createdAt')
                .lean(),
        ]);
        const items = [];
        for (const v of latestVerifications) {
            const name = [v.mentorProfileId?.userId?.firstName, v.mentorProfileId?.userId?.lastName]
                .filter(Boolean)
                .join(' ');
            items.push({
                type: 'VERIFICATION',
                title: name ? `Verification ${v.status.toLowerCase()} — ${name}` : `Verification ${v.status.toLowerCase()}`,
                detail: v.mentorProfileId?.currentCompany ? `Alumni at ${v.mentorProfileId.currentCompany}` : 'Alumni verification record',
                createdAt: (v.createdAt || new Date()).toString(),
            });
        }
        for (const r of latestRequests) {
            const student = [r.studentId?.firstName, r.studentId?.lastName].filter(Boolean).join(' ');
            items.push({
                type: 'REQUEST',
                title: student ? `Mentorship request by ${student}` : 'New mentorship request',
                detail: r.goal || r.message || '',
                createdAt: (r.createdAt || new Date()).toString(),
            });
        }
        for (const u of latestUsers) {
            items.push({
                type: 'USER_JOINED',
                title: `${u.firstName} ${u.lastName} joined`,
                detail: `Role: ${u.role.replace('_', ' ')}`,
                createdAt: (u.createdAt || new Date()).toString(),
            });
        }
        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return items.slice(0, limit).map((i) => ({ ...i, createdAt: new Date(i.createdAt).toISOString() }));
    }
    async getAlumniOfficerDashboard() {
        return this.cached('dash:alumni:v1', () => this.computeAlumniOfficerMetrics());
    }
    async computeAlumniOfficerMetrics() {
        const [totalAlumniMentors, verifiedMentors, rejectedVerifications, expiredVerifications, inactiveMentors, acceptingMentors, completedSessionsCount, currentMenteesSum,] = await Promise.all([
            this.userModel.countDocuments({ role: user_schema_1.Role.MENTOR }),
            this.mentorProfileModel.countDocuments({ verificationStatus: mentor_profile_schema_1.VerificationStatus.VERIFIED }),
            this.verificationModel.countDocuments({ status: mentor_profile_schema_1.VerificationStatus.REJECTED }),
            this.verificationModel.countDocuments({ status: mentor_profile_schema_1.VerificationStatus.EXPIRED }),
            this.mentorProfileModel.countDocuments({ status: 'INACTIVE' }),
            this.mentorProfileModel.countDocuments({ acceptingMentees: true, verificationStatus: mentor_profile_schema_1.VerificationStatus.VERIFIED }),
            this.sessionModel.countDocuments({ status: 'COMPLETED' }),
            this.mentorProfileModel.aggregate([
                { $group: { _id: null, sum: { $sum: '$currentMenteesCount' } } },
            ]),
        ]);
        const [pendingVerificationsDocs, mentorsByIndustry, topCompanies, signupSeriesData, averageSatisfaction] = await Promise.all([
            this.verificationModel
                .find({ status: mentor_profile_schema_1.VerificationStatus.PENDING })
                .sort({ createdAt: -1 })
                .limit(6)
                .populate({ path: 'mentorProfileId', select: 'currentCompany currentDesignation programme graduationYear', populate: { path: 'userId', select: 'firstName lastName' } })
                .lean(),
            this.mentorProfileModel.aggregate([
                { $match: { verificationStatus: mentor_profile_schema_1.VerificationStatus.VERIFIED } },
                { $group: { _id: '$industry', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 8 },
            ]),
            this.mentorProfileModel.aggregate([
                { $match: { verificationStatus: mentor_profile_schema_1.VerificationStatus.VERIFIED, currentCompany: { $ne: '' } } },
                { $group: { _id: '$currentCompany', count: { $sum: 1 }, mentees: { $sum: '$currentMenteesCount' } } },
                { $sort: { count: -1 } },
                { $limit: 6 },
            ]),
            this.signupSeries(user_schema_1.Role.MENTOR, 6),
            this.averageSatisfaction(),
        ]);
        const pendingVerifications = await this.verificationModel.countDocuments({ status: mentor_profile_schema_1.VerificationStatus.PENDING });
        return {
            overview: {
                totalAlumniMentors,
                verifiedMentors,
                pendingVerifications,
                rejectedVerifications,
                expiredVerifications,
                inactiveMentors,
                acceptingMentors,
                activeMentees: currentMenteesSum[0]?.sum ?? 0,
                completedSessionsCount,
            },
            averageSatisfaction,
            mentorsByIndustry: mentorsByIndustry.map((i) => ({ industry: i._id || 'Unknown', count: i.count })),
            topCompanies: topCompanies.map((c) => ({ company: c._id, mentors: c.count, mentees: c.mentees })),
            signupSeries: signupSeriesData,
            recentVerifications: pendingVerificationsDocs.map((v) => {
                const mp = v.mentorProfileId;
                const user = mp?.userId;
                return {
                    id: v._id.toString(),
                    status: v.status,
                    createdAt: new Date(v.createdAt).toISOString(),
                    mentorName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Unknown',
                    company: mp?.currentCompany || '—',
                    designation: mp?.currentDesignation || '—',
                    programme: mp?.programme || '—',
                    graduationYear: mp?.graduationYear ?? null,
                };
            }),
            meta: { generatedAt: new Date().toISOString(), cachedSeconds: CACHE_TTL_SECONDS },
        };
    }
    async getPlacementOfficerDashboard() {
        return this.cached('dash:placement:v1', () => this.computePlacementOfficerMetrics());
    }
    async computePlacementOfficerMetrics() {
        const now = new Date();
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        const [totalStudents, onboardedStudents, activeMentorshipsCount, atRiskMentorshipsCount, pendingRequests, completedSessionsCount, completedGoalsCount, totalGoalsCount, upcomingSessions, avgCompletionRows, oppActive, oppUpcoming, oppClosed, appCount, interviewCount, placementCount, readinessBuckets, connectionStats,] = await Promise.all([
            this.userModel.countDocuments({ role: user_schema_1.Role.STUDENT }),
            this.studentProfileModel.countDocuments(),
            this.mentorshipModel.countDocuments({ status: 'ACTIVE' }),
            this.mentorshipModel.countDocuments({ status: 'AT_RISK' }),
            this.requestModel.countDocuments({ status: mentorship_request_schema_1.RequestStatus.PENDING }),
            this.sessionModel.countDocuments({ status: 'COMPLETED' }),
            this.goalModel.countDocuments({ status: 'COMPLETED' }),
            this.goalModel.countDocuments(),
            this.sessionModel.countDocuments({ status: 'SCHEDULED', scheduledAt: { $gte: now, $lte: weekFromNow } }),
            this.studentProfileModel.aggregate([
                { $group: { _id: null, avg: { $avg: '$profileCompletion' } } },
            ]),
            this.opportunityModel.countDocuments({ status: 'ACTIVE' }),
            this.opportunityModel.countDocuments({ status: 'UPCOMING' }),
            this.opportunityModel.countDocuments({ status: 'CLOSED' }),
            this.placementApplicationModel.countDocuments(),
            this.placementApplicationModel.countDocuments({ status: 'INTERVIEW_SCHEDULED' }),
            this.placementApplicationModel.countDocuments({ status: 'PLACED' }),
            this.studentProfileModel.aggregate([
                {
                    $project: {
                        readiness: {
                            $cond: [
                                { $and: [{ $gte: ['$profileCompletion', 85] }, { $ne: ['$targetRole', ''] }, { $gte: [{ $size: { $ifNull: ['$currentSkills', []] } }, 4] }] },
                                'Ready',
                                {
                                    $cond: [
                                        { $and: [{ $gte: ['$profileCompletion', 60] }, { $ne: ['$targetRole', ''] }] },
                                        'Almost Ready',
                                        {
                                            $cond: [
                                                { $gte: ['$profileCompletion', 30] },
                                                'Needs Improvement',
                                                'Not Started'
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    }
                },
                { $group: { _id: '$readiness', count: { $sum: 1 } } }
            ]),
            this.studentProfileModel.aggregate([
                {
                    $lookup: {
                        from: 'mentorships',
                        localField: '_id',
                        foreignField: 'studentProfileId',
                        as: 'mentorships',
                    },
                },
                {
                    $project: {
                        targetIndustry: 1,
                        hasActiveMentor: {
                            $gt: [
                                {
                                    $size: {
                                        $filter: {
                                            input: '$mentorships',
                                            as: 'm',
                                            cond: { $eq: ['$$m.status', 'ACTIVE'] },
                                        },
                                    },
                                },
                                0,
                            ],
                        },
                    },
                },
                {
                    $group: {
                        _id: '$targetIndustry',
                        total: { $sum: 1 },
                        withMentor: { $sum: { $cond: ['$hasActiveMentor', 1, 0] } },
                    },
                },
                {
                    $project: {
                        industry: '$_id',
                        total: 1,
                        withMentor: 1,
                        withoutMentor: { $subtract: ['$total', '$withMentor'] },
                    },
                },
                { $sort: { withoutMentor: -1 } },
                { $limit: 8 },
            ]),
        ]);
        const [byIndustry, byGraduationYear, topSkills, monthlySeriesData, recentStudents, softwareEngineers, topRoles] = await Promise.all([
            this.studentProfileModel.aggregate([
                { $match: { targetIndustry: { $ne: '' } } },
                { $group: { _id: '$targetIndustry', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 8 },
            ]),
            this.studentProfileModel.aggregate([
                { $group: { _id: '$graduationYear', count: { $sum: 1 } } },
                { $sort: { _id: 1 } },
            ]),
            this.studentProfileModel.aggregate([
                { $unwind: '$currentSkills' },
                { $group: { _id: '$currentSkills', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 },
            ]),
            this.requestSeries(6),
            this.userModel
                .find({ role: user_schema_1.Role.STUDENT })
                .sort({ createdAt: -1 })
                .limit(6)
                .select('firstName lastName createdAt onboardingStatus verificationStatus')
                .lean(),
            this.studentProfileModel.find({
                targetRole: { $regex: /software engineer/i }
            }).select('currentSkills').lean(),
            this.studentProfileModel.aggregate([
                { $match: { targetRole: { $ne: '' } } },
                { $group: { _id: '$targetRole', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 8 },
            ]),
        ]);
        const readiness = { 'Ready': 0, 'Almost Ready': 0, 'Needs Improvement': 0, 'Not Started': 0 };
        readinessBuckets.forEach(b => { if (b._id)
            readiness[b._id] = b.count; });
        const requiredSkills = ['DSA', 'Java', 'SQL', 'System Design', 'Cloud'];
        const skillCounts = { 'DSA': 0, 'Java': 0, 'SQL': 0, 'System Design': 0, 'Cloud': 0 };
        softwareEngineers.forEach((s) => {
            const skillsLower = (s.currentSkills || []).map((sk) => sk.toLowerCase());
            requiredSkills.forEach(req => {
                if (skillsLower.includes(req.toLowerCase())) {
                    skillCounts[req]++;
                }
            });
        });
        const skillGaps = requiredSkills.map(skill => {
            const available = skillCounts[skill];
            const missing = softwareEngineers.length - available;
            return {
                skill,
                availableCount: available,
                missingCount: Math.max(0, missing),
            };
        });
        const placementRate = onboardedStudents > 0 ? Math.round((placementCount / onboardedStudents) * 100) : 0;
        return {
            overview: {
                totalStudents,
                onboardedStudents,
                avgProfileCompletion: Math.round(avgCompletionRows[0]?.avg ?? 0),
                activeMentorshipsCount,
                atRiskMentorshipsCount,
                pendingRequests,
                completedSessionsCount,
                upcomingSessionsThisWeek: upcomingSessions,
                goalsCompleted: completedGoalsCount,
                goalsTotal: totalGoalsCount,
                goalCompletionRate: totalGoalsCount > 0 ? Math.round((completedGoalsCount / totalGoalsCount) * 100) : 0,
            },
            careerReadiness: readiness,
            opportunities: {
                active: oppActive,
                upcoming: oppUpcoming,
                closed: oppClosed,
                applications: appCount,
                interviews: interviewCount,
                placements: placementCount,
                placementRate,
            },
            skillGaps,
            mentorshipConnection: connectionStats.map((item) => ({
                industry: item.industry || 'Unknown',
                total: item.total,
                withMentor: item.withMentor,
                withoutMentor: item.withoutMentor,
            })),
            studentsByTargetIndustry: byIndustry.map((i) => ({ industry: i._id, count: i.count })),
            studentsByGraduationYear: byGraduationYear.map((g) => ({ year: g._id, count: g.count })),
            topSkills: topSkills.map((s) => ({ skill: s._id, count: s.count })),
            topRoles: topRoles.map((r) => ({ role: r._id, count: r.count })),
            monthlySeries: monthlySeriesData,
            recentStudents: recentStudents.map((s) => ({
                id: s._id.toString(),
                name: `${s.firstName || ''} ${s.lastName || ''}`.trim(),
                createdAt: new Date(s.createdAt).toISOString(),
                onboardingStatus: s.onboardingStatus,
                verificationStatus: s.verificationStatus,
            })),
            meta: { generatedAt: new Date().toISOString(), cachedSeconds: CACHE_TTL_SECONDS },
        };
    }
    async bustDashboardCaches(keys = ['dash:admin:v2', 'dash:alumni:v1', 'dash:placement:v1']) {
        const redis = this.getRedis();
        if (redis) {
            redis.del(...keys).catch(() => undefined);
        }
    }
    async getDetailedAnalytics() {
        return this.getAdminDashboardMetrics();
    }
    async getUserGrowth(days) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const users = await this.userModel.find({
            createdAt: { $gte: startDate }
        }).select('role createdAt').lean();
        const growthMap = {};
        for (let i = 0; i <= days; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            growthMap[dateStr] = { date: dateStr, students: 0, alumni: 0, mentors: 0 };
        }
        users.forEach((u) => {
            const dateStr = new Date(u.createdAt).toISOString().split('T')[0];
            if (growthMap[dateStr]) {
                if (u.role === user_schema_1.Role.STUDENT) {
                    growthMap[dateStr].students++;
                }
                else if (u.role === user_schema_1.Role.MENTOR) {
                    growthMap[dateStr].mentors++;
                    growthMap[dateStr].alumni++;
                }
            }
        });
        return Object.values(growthMap).sort((a, b) => a.date.localeCompare(b.date));
    }
    async getVerificationOverview() {
        const [mentorPending, mentorApproved, mentorRejected, mentorChanges, studentPending, studentApproved, studentRejected, studentChanges] = await Promise.all([
            this.verificationModel.countDocuments({ status: 'PENDING' }),
            this.verificationModel.countDocuments({ status: 'VERIFIED' }),
            this.verificationModel.countDocuments({ status: 'REJECTED' }),
            this.verificationModel.countDocuments({ status: 'CHANGES_REQUESTED' }),
            this.userModel.countDocuments({ role: user_schema_1.Role.STUDENT, onboardingStatus: 'UNDER_REVIEW' }),
            this.userModel.countDocuments({ role: user_schema_1.Role.STUDENT, onboardingStatus: 'APPROVED' }),
            this.userModel.countDocuments({ role: user_schema_1.Role.STUDENT, onboardingStatus: 'REJECTED' }),
            this.userModel.countDocuments({ role: user_schema_1.Role.STUDENT, onboardingStatus: 'CHANGES_REQUESTED' }),
        ]);
        return {
            mentor: {
                pending: mentorPending,
                approved: mentorApproved,
                rejected: mentorRejected,
                changesRequested: mentorChanges,
            },
            student: {
                pending: studentPending,
                approved: studentApproved,
                rejected: studentRejected,
                changesRequested: studentChanges,
            }
        };
    }
    async getMentorshipOverview() {
        const [active, completed, paused, cancelled, pendingRequests] = await Promise.all([
            this.mentorshipModel.countDocuments({ status: 'ACTIVE' }),
            this.mentorshipModel.countDocuments({ status: 'COMPLETED' }),
            this.mentorshipModel.countDocuments({ status: 'PAUSED' }),
            this.mentorshipModel.countDocuments({ status: 'CANCELLED' }),
            this.requestModel.countDocuments({ status: 'PENDING' }),
        ]);
        return {
            active,
            completed,
            paused,
            cancelled,
            pendingRequests,
        };
    }
    async getMentorUtilization() {
        const mentors = await this.mentorProfileModel.find({
            verificationStatus: mentor_profile_schema_1.VerificationStatus.VERIFIED
        }).populate('userId').lean();
        const list = mentors.map((m) => {
            const current = m.currentMenteesCount || 0;
            const max = m.maxCapacity || 3;
            const pct = max > 0 ? (current / max) * 100 : 0;
            return {
                id: m._id.toString(),
                name: m.userId ? `${m.userId.firstName} ${m.userId.lastName}` : 'Alumni Mentor',
                current,
                max,
                percentage: Math.round(pct),
            };
        });
        let totalMax = 0;
        let totalCurrent = 0;
        list.forEach(item => {
            totalMax += item.max;
            totalCurrent += item.current;
        });
        const overallPercentage = totalMax > 0 ? Math.round((totalCurrent / totalMax) * 100) : 0;
        return {
            overallPercentage,
            mentors: list,
        };
    }
    async getMatchingOverview() {
        const students = await this.studentProfileModel.find().limit(20).lean();
        const mentors = await this.mentorProfileModel.find({
            verificationStatus: mentor_profile_schema_1.VerificationStatus.VERIFIED,
            status: mentor_profile_schema_1.MentorStatus.ACTIVE,
        }).limit(20).lean();
        let sumMatchScore = 0;
        let scoreCount = 0;
        for (const student of students) {
            try {
                const recommendations = await this.matchingService.calculateRecommendation(student.userId.toString());
                recommendations.forEach((r) => {
                    sumMatchScore += r.matchScore;
                    scoreCount++;
                });
            }
            catch (err) {
            }
        }
        const averageMatchScore = scoreCount > 0 ? Math.round(sumMatchScore / scoreCount) : 82;
        const successfulMatches = await this.mentorshipModel.countDocuments({ status: 'ACTIVE' });
        const pendingRequests = await this.requestModel.countDocuments({ status: 'PENDING' });
        const topIndustries = mentors.map(m => m.industry).filter(Boolean);
        const uniqueIndustries = [...new Set(topIndustries)].slice(0, 3);
        return {
            totalRecommendationsGenerated: scoreCount || (students.length * 5),
            averageMatchScore,
            successfulMatches,
            activeRecommendations: pendingRequests,
            topMatchingIndustries: uniqueIndustries,
            topMatchingSkills: ['Python', 'Data Structures', 'Web Development'],
        };
    }
    async getTopSkills() {
        const studentSkills = await this.studentProfileModel.aggregate([
            { $unwind: '$currentSkills' },
            { $group: { _id: '$currentSkills', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);
        const mentorSkills = await this.mentorProfileModel.aggregate([
            { $match: { verificationStatus: mentor_profile_schema_1.VerificationStatus.VERIFIED } },
            { $unwind: '$expertise' },
            { $group: { _id: '$expertise', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);
        const studentSkillMap = new Map(studentSkills.map(s => [s._id.toLowerCase(), s.count]));
        const matchedSkills = mentorSkills.map(m => {
            const studentCount = studentSkillMap.get(m._id.toLowerCase()) || 0;
            return {
                skill: m._id,
                count: studentCount + m.count,
            };
        }).sort((a, b) => b.count - a.count).slice(0, 10);
        return {
            studentSkills: studentSkills.map(s => ({ skill: s._id, count: s.count })),
            mentorSkills: mentorSkills.map(m => ({ skill: m._id, count: m.count })),
            matchedSkills,
        };
    }
    async getTopIndustries() {
        const studentIndustries = await this.studentProfileModel.aggregate([
            { $group: { _id: '$targetIndustry', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);
        const mentorIndustries = await this.mentorProfileModel.aggregate([
            { $match: { verificationStatus: mentor_profile_schema_1.VerificationStatus.VERIFIED } },
            { $group: { _id: '$industry', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);
        const mentorships = await this.mentorshipModel.find({ status: 'ACTIVE' }).populate('mentorProfileId').lean();
        const mentorshipIndustryMap = {};
        mentorships.forEach((m) => {
            const industry = m.mentorProfileId?.industry || 'Unknown';
            mentorshipIndustryMap[industry] = (mentorshipIndustryMap[industry] || 0) + 1;
        });
        const successfulIndustries = Object.entries(mentorshipIndustryMap).map(([industry, count]) => ({
            industry,
            count
        })).sort((a, b) => b.count - a.count).slice(0, 10);
        return {
            studentIndustries: studentIndustries.map(s => ({ industry: s._id || 'Unknown', count: s.count })),
            mentorIndustries: mentorIndustries.map(m => ({ industry: m._id || 'Unknown', count: m.count })),
            successfulIndustries,
        };
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(1, (0, mongoose_1.InjectModel)(student_profile_schema_1.StudentProfile.name)),
    __param(2, (0, mongoose_1.InjectModel)(mentor_profile_schema_1.MentorProfile.name)),
    __param(3, (0, mongoose_1.InjectModel)(alumni_verification_schema_1.AlumniVerification.name)),
    __param(4, (0, mongoose_1.InjectModel)(mentorship_schema_1.Mentorship.name)),
    __param(5, (0, mongoose_1.InjectModel)(mentorship_request_schema_1.MentorshipRequest.name)),
    __param(6, (0, mongoose_1.InjectModel)(session_schema_1.Session.name)),
    __param(7, (0, mongoose_1.InjectModel)(goal_schema_1.Goal.name)),
    __param(8, (0, mongoose_1.InjectModel)(feedback_schema_1.Feedback.name)),
    __param(9, (0, mongoose_1.InjectModel)(opportunity_schema_1.Opportunity.name)),
    __param(10, (0, mongoose_1.InjectModel)(placement_application_schema_1.PlacementApplication.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        matching_service_1.MatchingService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map
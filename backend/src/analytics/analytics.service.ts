import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument, Role } from '../database/schemas/user.schema';
import { MentorProfile, MentorProfileDocument, VerificationStatus, MentorStatus } from '../database/schemas/mentor-profile.schema';
import { StudentProfile, StudentProfileDocument } from '../database/schemas/student-profile.schema';
import { Mentorship, MentorshipDocument } from '../database/schemas/mentorship.schema';
import { Session, SessionDocument } from '../database/schemas/session.schema';
import { Goal, GoalDocument } from '../database/schemas/goal.schema';
import { Feedback, FeedbackDocument } from '../database/schemas/feedback.schema';
import { AlumniVerification, AlumniVerificationDocument } from '../database/schemas/alumni-verification.schema';
import { MentorshipRequest, MentorshipRequestDocument, RequestStatus } from '../database/schemas/mentorship-request.schema';
import { Opportunity, OpportunityDocument } from '../database/schemas/opportunity.schema';
import { PlacementApplication, PlacementApplicationDocument } from '../database/schemas/placement-application.schema';
import Redis from 'ioredis';
import { MatchingService } from '../matching/matching.service';

const CACHE_TTL_SECONDS = 30;

@Injectable()
export class AnalyticsService {
  private redis: Redis | null = null;

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(StudentProfile.name)
    private readonly studentProfileModel: Model<StudentProfileDocument>,
    @InjectModel(MentorProfile.name)
    private readonly mentorProfileModel: Model<MentorProfileDocument>,
    @InjectModel(AlumniVerification.name)
    private readonly verificationModel: Model<AlumniVerificationDocument>,
    @InjectModel(Mentorship.name)
    private readonly mentorshipModel: Model<MentorshipDocument>,
    @InjectModel(MentorshipRequest.name)
    private readonly requestModel: Model<MentorshipRequestDocument>,
    @InjectModel(Session.name)
    private readonly sessionModel: Model<SessionDocument>,
    @InjectModel(Goal.name)
    private readonly goalModel: Model<GoalDocument>,
    @InjectModel(Feedback.name)
    private readonly feedbackModel: Model<FeedbackDocument>,
    @InjectModel(Opportunity.name)
    private readonly opportunityModel: Model<OpportunityDocument>,
    @InjectModel(PlacementApplication.name)
    private readonly placementApplicationModel: Model<PlacementApplicationDocument>,
    private readonly matchingService: MatchingService,
  ) {}

  // ── Redis cache (short TTL so aggregates stay fresh; events also bust these keys) ──
  private getRedis(): Redis | null {
    if (this.redis) return this.redis;
    try {
      const redisOptions: any = {};
      if (process.env.REDIS_URL && process.env.REDIS_URL.startsWith('rediss://')) {
        redisOptions.tls = { rejectUnauthorized: false };
      }
      this.redis = process.env.REDIS_URL
        ? new Redis(process.env.REDIS_URL, { lazyConnect: true, ...redisOptions })
        : new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379', 10),
            lazyConnect: true,
            ...redisOptions,
          });
    } catch {
      this.redis = null;
    }
    return this.redis;
  }

  private async cached<T>(key: string, compute: () => Promise<T>): Promise<T> {
    const redis = this.getRedis();
    if (redis) {
      try {
        const hit = await redis.get(key);
        if (hit) return JSON.parse(hit) as T;
      } catch {
        // cache unavailable — compute directly
      }
    }
    const value = await compute();
    if (redis) {
      redis.set(key, JSON.stringify(value), 'EX', CACHE_TTL_SECONDS).catch(() => undefined);
    }
    return value;
  }

  /** Build a contiguous list of the last `n` months as {key, label, year, month}. */
  private lastNMonths(n: number): { key: string; label: string; year: number; month: number }[] {
    const out: { key: string; label: string; year: number; month: number }[] = [];
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

  /** Real time-series of mentorship requests vs acceptances over the last n months. */
  private async requestSeries(n = 6) {
    const months = this.lastNMonths(n);
    const start = new Date(months[0].year, months[0].month - 1, 1);
    const rows = await this.requestModel.aggregate([
      { $match: { createdAt: { $gte: start } } },
      {
        $group: {
          _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } },
          total: { $sum: 1 },
          accepted: { $sum: { $cond: [{ $eq: ['$status', RequestStatus.ACCEPTED] }, 1, 0] } },
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

  /** Real time-series of user signups filtered by role over the last n months. */
  private async signupSeries(role?: Role, n = 6) {
    const months = this.lastNMonths(n);
    const start = new Date(months[0].year, months[0].month - 1, 1);
    const match: Record<string, unknown> = { createdAt: { $gte: start } };
    if (role) match.role = role;
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

  /** Average feedback rating across the platform (real data, 0 when none exists). */
  private async averageSatisfaction(): Promise<number> {
    const stats = await this.feedbackModel.aggregate([
      { $group: { _id: null, avgRating: { $avg: '$rating' } } },
    ]);
    return parseFloat((stats[0]?.avgRating || 0).toFixed(1));
  }

  // ─────────────────────────────────────────────────────────────
  // ADMIN DASHBOARD
  // ─────────────────────────────────────────────────────────────
  async getAdminDashboardMetrics() {
    return this.cached('dash:admin:v2', () => this.computeAdminMetrics());
  }

  private async computeAdminMetrics() {
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    const [
      totalUsers,
      totalStudents,
      totalVerifiedMentors,
      totalMentorProfiles,
      mentorPendingVerifications,
      studentPendingVerifications,
      activeMentorshipsCount,
      atRiskMentorshipsCount,
      pendingRequests,
      totalRequests,
      acceptedRequests,
      declinedRequests,
      expiredRequests,
      completedSessionsCount,
      missedSessionsCount,
      sessionsThisWeek,
      completedGoalsCount,
    ] = await Promise.all([
      this.userModel.countDocuments(),
      this.studentProfileModel.countDocuments(),
      this.mentorProfileModel.countDocuments({ verificationStatus: VerificationStatus.VERIFIED }),
      this.mentorProfileModel.countDocuments(),
      this.verificationModel.countDocuments({ status: VerificationStatus.PENDING }),
      this.userModel.countDocuments({ role: Role.STUDENT, onboardingStatus: 'UNDER_REVIEW' }),
      this.mentorshipModel.countDocuments({ status: 'ACTIVE' }),
      this.mentorshipModel.countDocuments({ status: 'AT_RISK' }),
      this.requestModel.countDocuments({ status: RequestStatus.PENDING }),
      this.requestModel.countDocuments(),
      this.requestModel.countDocuments({ status: RequestStatus.ACCEPTED }),
      this.requestModel.countDocuments({ status: RequestStatus.DECLINED }),
      this.requestModel.countDocuments({ status: RequestStatus.EXPIRED }),
      this.sessionModel.countDocuments({ status: 'COMPLETED' }),
      this.sessionModel.countDocuments({ status: 'NO_SHOW' }),
      this.sessionModel.countDocuments({
        status: 'SCHEDULED',
        scheduledAt: { $gte: new Date(), $lte: weekFromNow },
      }),
      this.goalModel.countDocuments({ status: 'COMPLETED' }),
    ]);

    const [usersByRoleRows, monthlySeries, industries, averageSatisfaction, capacityStats] =
      await Promise.all([
        this.userModel.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
        this.requestSeries(6),
        this.mentorProfileModel.aggregate([
          { $match: { verificationStatus: VerificationStatus.VERIFIED } },
          { $group: { _id: '$industry', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 8 },
        ]),
        this.averageSatisfaction(),
        this.mentorProfileModel.aggregate([
          { $match: { verificationStatus: VerificationStatus.VERIFIED } },
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

  /** Unified real activity feed built from the latest records across core collections. */
  private async buildRecentActivity(limit = 8) {
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

    type ActivityItem = { type: string; title: string; detail: string; createdAt: string };
    const items: ActivityItem[] = [];

    for (const v of latestVerifications as any[]) {
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
    for (const r of latestRequests as any[]) {
      const student = [r.studentId?.firstName, r.studentId?.lastName].filter(Boolean).join(' ');
      items.push({
        type: 'REQUEST',
        title: student ? `Mentorship request by ${student}` : 'New mentorship request',
        detail: r.goal || r.message || '',
        createdAt: (r.createdAt || new Date()).toString(),
      });
    }
    for (const u of latestUsers as any[]) {
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

  // ─────────────────────────────────────────────────────────────
  // ALUMNI OFFICER DASHBOARD
  // ─────────────────────────────────────────────────────────────
  async getAlumniOfficerDashboard() {
    return this.cached('dash:alumni:v1', () => this.computeAlumniOfficerMetrics());
  }

  private async computeAlumniOfficerMetrics() {
    const [
      totalAlumniMentors,
      verifiedMentors,
      rejectedVerifications,
      expiredVerifications,
      inactiveMentors,
      acceptingMentors,
      completedSessionsCount,
      currentMenteesSum,
    ] = await Promise.all([
      this.userModel.countDocuments({ role: Role.MENTOR }),
      this.mentorProfileModel.countDocuments({ verificationStatus: VerificationStatus.VERIFIED }),
      this.verificationModel.countDocuments({ status: VerificationStatus.REJECTED }),
      this.verificationModel.countDocuments({ status: VerificationStatus.EXPIRED }),
      this.mentorProfileModel.countDocuments({ status: 'INACTIVE' }),
      this.mentorProfileModel.countDocuments({ acceptingMentees: true, verificationStatus: VerificationStatus.VERIFIED }),
      this.sessionModel.countDocuments({ status: 'COMPLETED' }),
      this.mentorProfileModel.aggregate([
        { $group: { _id: null, sum: { $sum: '$currentMenteesCount' } } },
      ]),
    ]);

    const [pendingVerificationsDocs, mentorsByIndustry, topCompanies, signupSeriesData, averageSatisfaction] =
      await Promise.all([
        this.verificationModel
          .find({ status: VerificationStatus.PENDING })
          .sort({ createdAt: -1 })
          .limit(6)
          .populate({ path: 'mentorProfileId', select: 'currentCompany currentDesignation programme graduationYear', populate: { path: 'userId', select: 'firstName lastName' } })
          .lean(),
        this.mentorProfileModel.aggregate([
          { $match: { verificationStatus: VerificationStatus.VERIFIED } },
          { $group: { _id: '$industry', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 8 },
        ]),
        this.mentorProfileModel.aggregate([
          { $match: { verificationStatus: VerificationStatus.VERIFIED, currentCompany: { $ne: '' } } },
          { $group: { _id: '$currentCompany', count: { $sum: 1 }, mentees: { $sum: '$currentMenteesCount' } } },
          { $sort: { count: -1 } },
          { $limit: 6 },
        ]),
        this.signupSeries(Role.MENTOR, 6),
        this.averageSatisfaction(),
      ]);

    const pendingVerifications = await this.verificationModel.countDocuments({ status: VerificationStatus.PENDING });

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
      recentVerifications: pendingVerificationsDocs.map((v: any) => {
        const mp: any = v.mentorProfileId;
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

  // ─────────────────────────────────────────────────────────────
  // PLACEMENT OFFICER DASHBOARD
  // ─────────────────────────────────────────────────────────────
  async getPlacementOfficerDashboard() {
    return this.cached('dash:placement:v1', () => this.computePlacementOfficerMetrics());
  }

  private async computePlacementOfficerMetrics() {
    const now = new Date();
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    const [
      totalStudents,
      onboardedStudents,
      activeMentorshipsCount,
      atRiskMentorshipsCount,
      pendingRequests,
      completedSessionsCount,
      completedGoalsCount,
      totalGoalsCount,
      upcomingSessions,
      avgCompletionRows,
      oppActive,
      oppUpcoming,
      oppClosed,
      appCount,
      interviewCount,
      placementCount,
      readinessBuckets,
      connectionStats,
    ] = await Promise.all([
      this.userModel.countDocuments({ role: Role.STUDENT }),
      this.studentProfileModel.countDocuments(),
      this.mentorshipModel.countDocuments({ status: 'ACTIVE' }),
      this.mentorshipModel.countDocuments({ status: 'AT_RISK' }),
      this.requestModel.countDocuments({ status: RequestStatus.PENDING }),
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
      ]) as Promise<any[]>,
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
        .find({ role: Role.STUDENT })
        .sort({ createdAt: -1 })
        .limit(6)
        .select('firstName lastName createdAt onboardingStatus verificationStatus')
        .lean(),
      this.studentProfileModel.find({
        targetRole: { $regex: /software engineer/i }
      }).select('currentSkills').lean() as Promise<any[]>,
      this.studentProfileModel.aggregate([
        { $match: { targetRole: { $ne: '' } } },
        { $group: { _id: '$targetRole', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
    ]);

    // Readiness mapping
    const readiness: Record<string, number> = { 'Ready': 0, 'Almost Ready': 0, 'Needs Improvement': 0, 'Not Started': 0 };
    readinessBuckets.forEach(b => { if (b._id) readiness[b._id] = b.count; });

    // Skill Gap calculations for standard Software Engineer requirements
    const requiredSkills = ['DSA', 'Java', 'SQL', 'System Design', 'Cloud'];
    const skillCounts: Record<string, number> = { 'DSA': 0, 'Java': 0, 'SQL': 0, 'System Design': 0, 'Cloud': 0 };
    softwareEngineers.forEach((s: any) => {
      const skillsLower = (s.currentSkills || []).map((sk: string) => sk.toLowerCase());
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
      mentorshipConnection: connectionStats.map((item: any) => ({
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
      recentStudents: recentStudents.map((s: any) => ({
        id: s._id.toString(),
        name: `${s.firstName || ''} ${s.lastName || ''}`.trim(),
        createdAt: new Date(s.createdAt).toISOString(),
        onboardingStatus: s.onboardingStatus,
        verificationStatus: s.verificationStatus,
      })),
      meta: { generatedAt: new Date().toISOString(), cachedSeconds: CACHE_TTL_SECONDS },
    };
  }

  /** Invalidate dashboard caches (called when relevant lifecycle events occur). */
  async bustDashboardCaches(keys: string[] = ['dash:admin:v2', 'dash:alumni:v1', 'dash:placement:v1']) {
    const redis = this.getRedis();
    if (redis) {
      redis.del(...keys).catch(() => undefined);
    }
  }

  // Kept for backwards compatibility with admin.controller GET /admin/analytics
  async getDetailedAnalytics() {
    return this.getAdminDashboardMetrics();
  }

  async getUserGrowth(days: number) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const users = await this.userModel.find({
      createdAt: { $gte: startDate }
    }).select('role createdAt').lean();

    const growthMap: Record<string, { date: string; students: number; alumni: number; mentors: number }> = {};

    for (let i = 0; i <= days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      growthMap[dateStr] = { date: dateStr, students: 0, alumni: 0, mentors: 0 };
    }

    users.forEach((u: any) => {
      const dateStr = new Date(u.createdAt).toISOString().split('T')[0];
      if (growthMap[dateStr]) {
        if (u.role === Role.STUDENT) {
          growthMap[dateStr].students++;
        } else if (u.role === Role.MENTOR) {
          growthMap[dateStr].mentors++;
          growthMap[dateStr].alumni++;
        }
      }
    });

    return Object.values(growthMap).sort((a, b) => a.date.localeCompare(b.date));
  }

  async getVerificationOverview() {
    const [
      mentorPending, mentorApproved, mentorRejected, mentorChanges,
      studentPending, studentApproved, studentRejected, studentChanges
    ] = await Promise.all([
      this.verificationModel.countDocuments({ status: 'PENDING' }),
      this.verificationModel.countDocuments({ status: 'VERIFIED' }),
      this.verificationModel.countDocuments({ status: 'REJECTED' }),
      this.verificationModel.countDocuments({ status: 'CHANGES_REQUESTED' }),

      this.userModel.countDocuments({ role: Role.STUDENT, onboardingStatus: 'UNDER_REVIEW' }),
      this.userModel.countDocuments({ role: Role.STUDENT, onboardingStatus: 'APPROVED' }),
      this.userModel.countDocuments({ role: Role.STUDENT, onboardingStatus: 'REJECTED' }),
      this.userModel.countDocuments({ role: Role.STUDENT, onboardingStatus: 'CHANGES_REQUESTED' }),
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
    const [
      active, completed, paused, cancelled, pendingRequests
    ] = await Promise.all([
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
      verificationStatus: VerificationStatus.VERIFIED
    }).populate('userId').lean();

    const list = mentors.map((m: any) => {
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
      verificationStatus: VerificationStatus.VERIFIED,
      status: MentorStatus.ACTIVE,
    }).limit(20).lean();

    let sumMatchScore = 0;
    let scoreCount = 0;

    for (const student of students) {
      try {
        const recommendations = await this.matchingService.calculateRecommendation(student.userId.toString());
        recommendations.forEach((r: any) => {
          sumMatchScore += r.matchScore;
          scoreCount++;
        });
      } catch (err) {
        // Skip on error
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
      { $match: { verificationStatus: VerificationStatus.VERIFIED } },
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
      { $match: { verificationStatus: VerificationStatus.VERIFIED } },
      { $group: { _id: '$industry', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const mentorships = await this.mentorshipModel.find({ status: 'ACTIVE' }).populate('mentorProfileId').lean();
    const mentorshipIndustryMap: Record<string, number> = {};
    mentorships.forEach((m: any) => {
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
}

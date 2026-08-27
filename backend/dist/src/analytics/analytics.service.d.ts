import { Model } from 'mongoose';
import { UserDocument } from '../database/schemas/user.schema';
import { MentorProfileDocument } from '../database/schemas/mentor-profile.schema';
import { StudentProfileDocument } from '../database/schemas/student-profile.schema';
import { MentorshipDocument } from '../database/schemas/mentorship.schema';
import { SessionDocument } from '../database/schemas/session.schema';
import { GoalDocument } from '../database/schemas/goal.schema';
import { FeedbackDocument } from '../database/schemas/feedback.schema';
import { AlumniVerificationDocument } from '../database/schemas/alumni-verification.schema';
import { MentorshipRequestDocument } from '../database/schemas/mentorship-request.schema';
import { OpportunityDocument } from '../database/schemas/opportunity.schema';
import { PlacementApplicationDocument } from '../database/schemas/placement-application.schema';
import { MatchingService } from '../matching/matching.service';
export declare class AnalyticsService {
    private readonly userModel;
    private readonly studentProfileModel;
    private readonly mentorProfileModel;
    private readonly verificationModel;
    private readonly mentorshipModel;
    private readonly requestModel;
    private readonly sessionModel;
    private readonly goalModel;
    private readonly feedbackModel;
    private readonly opportunityModel;
    private readonly placementApplicationModel;
    private readonly matchingService;
    private redis;
    constructor(userModel: Model<UserDocument>, studentProfileModel: Model<StudentProfileDocument>, mentorProfileModel: Model<MentorProfileDocument>, verificationModel: Model<AlumniVerificationDocument>, mentorshipModel: Model<MentorshipDocument>, requestModel: Model<MentorshipRequestDocument>, sessionModel: Model<SessionDocument>, goalModel: Model<GoalDocument>, feedbackModel: Model<FeedbackDocument>, opportunityModel: Model<OpportunityDocument>, placementApplicationModel: Model<PlacementApplicationDocument>, matchingService: MatchingService);
    private getRedis;
    private cached;
    private lastNMonths;
    private requestSeries;
    private signupSeries;
    private averageSatisfaction;
    getAdminDashboardMetrics(): Promise<{
        overview: {
            totalUsers: number;
            usersByRole: {
                role: any;
                count: any;
            }[];
            totalStudents: number;
            totalVerifiedMentors: number;
            totalMentorProfiles: number;
            totalPendingVerifications: number;
            activeMentorshipsCount: number;
            atRiskMentorshipsCount: number;
            pendingRequests: number;
            sessionsThisWeek: number;
        };
        requests: {
            totalRequests: number;
            pendingRequests: number;
            acceptanceRate: number;
            rejectionRate: number;
            expiryRate: number;
        };
        engagement: {
            completedSessionsCount: number;
            sessionCompletionRate: number;
            sessionsThisWeek: number;
            completedGoalsCount: number;
            mentorUtilization: number;
            averageSatisfaction: number;
        };
        monthlySeries: {
            month: string;
            requests: any;
            accepted: any;
        }[];
        industries: {
            industry: any;
            count: any;
        }[];
        recentActivity: {
            createdAt: string;
            type: string;
            title: string;
            detail: string;
        }[];
        meta: {
            generatedAt: string;
            cachedSeconds: number;
        };
    }>;
    private computeAdminMetrics;
    private buildRecentActivity;
    getAlumniOfficerDashboard(): Promise<{
        overview: {
            totalAlumniMentors: number;
            verifiedMentors: number;
            pendingVerifications: number;
            rejectedVerifications: number;
            expiredVerifications: number;
            inactiveMentors: number;
            acceptingMentors: number;
            activeMentees: any;
            completedSessionsCount: number;
        };
        averageSatisfaction: number;
        mentorsByIndustry: {
            industry: any;
            count: any;
        }[];
        topCompanies: {
            company: any;
            mentors: any;
            mentees: any;
        }[];
        signupSeries: {
            month: string;
            signups: any;
        }[];
        recentVerifications: {
            id: any;
            status: any;
            createdAt: string;
            mentorName: string;
            company: any;
            designation: any;
            programme: any;
            graduationYear: any;
        }[];
        meta: {
            generatedAt: string;
            cachedSeconds: number;
        };
    }>;
    private computeAlumniOfficerMetrics;
    getPlacementOfficerDashboard(): Promise<{
        overview: {
            totalStudents: number;
            onboardedStudents: number;
            avgProfileCompletion: number;
            activeMentorshipsCount: number;
            atRiskMentorshipsCount: number;
            pendingRequests: number;
            completedSessionsCount: number;
            upcomingSessionsThisWeek: number;
            goalsCompleted: number;
            goalsTotal: number;
            goalCompletionRate: number;
        };
        careerReadiness: Record<string, number>;
        opportunities: {
            active: number;
            upcoming: number;
            closed: number;
            applications: number;
            interviews: number;
            placements: number;
            placementRate: number;
        };
        skillGaps: {
            skill: string;
            availableCount: number;
            missingCount: number;
        }[];
        mentorshipConnection: {
            industry: any;
            total: any;
            withMentor: any;
            withoutMentor: any;
        }[];
        studentsByTargetIndustry: {
            industry: any;
            count: any;
        }[];
        studentsByGraduationYear: {
            year: any;
            count: any;
        }[];
        topSkills: {
            skill: any;
            count: any;
        }[];
        topRoles: {
            role: any;
            count: any;
        }[];
        monthlySeries: {
            month: string;
            requests: any;
            accepted: any;
        }[];
        recentStudents: {
            id: any;
            name: string;
            createdAt: string;
            onboardingStatus: any;
            verificationStatus: any;
        }[];
        meta: {
            generatedAt: string;
            cachedSeconds: number;
        };
    }>;
    private computePlacementOfficerMetrics;
    bustDashboardCaches(keys?: string[]): Promise<void>;
    getDetailedAnalytics(): Promise<{
        overview: {
            totalUsers: number;
            usersByRole: {
                role: any;
                count: any;
            }[];
            totalStudents: number;
            totalVerifiedMentors: number;
            totalMentorProfiles: number;
            totalPendingVerifications: number;
            activeMentorshipsCount: number;
            atRiskMentorshipsCount: number;
            pendingRequests: number;
            sessionsThisWeek: number;
        };
        requests: {
            totalRequests: number;
            pendingRequests: number;
            acceptanceRate: number;
            rejectionRate: number;
            expiryRate: number;
        };
        engagement: {
            completedSessionsCount: number;
            sessionCompletionRate: number;
            sessionsThisWeek: number;
            completedGoalsCount: number;
            mentorUtilization: number;
            averageSatisfaction: number;
        };
        monthlySeries: {
            month: string;
            requests: any;
            accepted: any;
        }[];
        industries: {
            industry: any;
            count: any;
        }[];
        recentActivity: {
            createdAt: string;
            type: string;
            title: string;
            detail: string;
        }[];
        meta: {
            generatedAt: string;
            cachedSeconds: number;
        };
    }>;
    getUserGrowth(days: number): Promise<{
        date: string;
        students: number;
        alumni: number;
        mentors: number;
    }[]>;
    getVerificationOverview(): Promise<{
        mentor: {
            pending: number;
            approved: number;
            rejected: number;
            changesRequested: number;
        };
        student: {
            pending: number;
            approved: number;
            rejected: number;
            changesRequested: number;
        };
    }>;
    getMentorshipOverview(): Promise<{
        active: number;
        completed: number;
        paused: number;
        cancelled: number;
        pendingRequests: number;
    }>;
    getMentorUtilization(): Promise<{
        overallPercentage: number;
        mentors: {
            id: any;
            name: string;
            current: any;
            max: any;
            percentage: number;
        }[];
    }>;
    getMatchingOverview(): Promise<{
        totalRecommendationsGenerated: number;
        averageMatchScore: number;
        successfulMatches: number;
        activeRecommendations: number;
        topMatchingIndustries: string[];
        topMatchingSkills: string[];
    }>;
    getTopSkills(): Promise<{
        studentSkills: {
            skill: any;
            count: any;
        }[];
        mentorSkills: {
            skill: any;
            count: any;
        }[];
        matchedSkills: {
            skill: any;
            count: any;
        }[];
    }>;
    getTopIndustries(): Promise<{
        studentIndustries: {
            industry: any;
            count: any;
        }[];
        mentorIndustries: {
            industry: any;
            count: any;
        }[];
        successfulIndustries: {
            industry: string;
            count: number;
        }[];
    }>;
}

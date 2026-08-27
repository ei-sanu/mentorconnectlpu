import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    getDashboardMetrics(): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
}

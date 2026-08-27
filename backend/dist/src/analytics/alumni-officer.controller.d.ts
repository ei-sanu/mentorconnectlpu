import { Model } from 'mongoose';
import { AnalyticsService } from '../analytics/analytics.service';
import { AlumniVerificationDocument } from '../database/schemas/alumni-verification.schema';
import { MentorProfileDocument } from '../database/schemas/mentor-profile.schema';
export declare class AlumniOfficerController {
    private readonly analyticsService;
    private readonly verificationModel;
    private readonly mentorProfileModel;
    constructor(analyticsService: AnalyticsService, verificationModel: Model<AlumniVerificationDocument>, mentorProfileModel: Model<MentorProfileDocument>);
    getDashboard(): Promise<any>;
    getVerifications(page?: string, limit?: string, status?: string, q?: string): Promise<any>;
    getMentors(page?: string, limit?: string, q?: string): Promise<any>;
}

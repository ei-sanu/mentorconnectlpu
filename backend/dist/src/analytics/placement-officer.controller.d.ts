import { Model } from 'mongoose';
import { AnalyticsService } from '../analytics/analytics.service';
import { StudentProfileDocument } from '../database/schemas/student-profile.schema';
import { OpportunityDocument } from '../database/schemas/opportunity.schema';
import { PlacementApplicationDocument } from '../database/schemas/placement-application.schema';
export declare class PlacementOfficerController {
    private readonly analyticsService;
    private readonly studentProfileModel;
    private readonly opportunityModel;
    private readonly placementApplicationModel;
    constructor(analyticsService: AnalyticsService, studentProfileModel: Model<StudentProfileDocument>, opportunityModel: Model<OpportunityDocument>, placementApplicationModel: Model<PlacementApplicationDocument>);
    getDashboard(): Promise<any>;
    getStudents(page?: string, limit?: string, q?: string, industry?: string): Promise<any>;
    getOpportunities(page?: string, limit?: string, status?: string): Promise<any>;
    createOpportunity(body: any): Promise<any>;
    getApplications(page?: string, limit?: string): Promise<any>;
    updateApplication(id: string, body: any): Promise<any>;
    getStudentDetail(id: string): Promise<any>;
}

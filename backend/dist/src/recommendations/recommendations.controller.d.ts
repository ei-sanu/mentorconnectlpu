import { RecommendationsService } from './recommendations.service';
export declare class RecommendationsController {
    private readonly recommendationsService;
    constructor(recommendationsService: RecommendationsService);
    getRecommendations(user: any): Promise<any>;
    getMatchDetails(user: any, mentorId: string): Promise<any>;
    recalculate(user: any): Promise<any>;
}

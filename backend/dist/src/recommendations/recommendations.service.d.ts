import { Model } from 'mongoose';
import { StudentProfileDocument } from '../database/schemas/student-profile.schema';
import { MentorProfileDocument } from '../database/schemas/mentor-profile.schema';
import { MatchingService } from '../matching/matching.service';
export declare class RecommendationsService {
    private readonly studentProfileModel;
    private readonly mentorProfileModel;
    private readonly matchingService;
    private redis;
    constructor(studentProfileModel: Model<StudentProfileDocument>, mentorProfileModel: Model<MentorProfileDocument>, matchingService: MatchingService);
    getRecommendedMentors(userId: string): Promise<any>;
    getMentorMatchDetails(userId: string, mentorId: string): Promise<any>;
    invalidateCacheForStudent(studentProfileId: string): Promise<void>;
    invalidateAllCaches(): Promise<void>;
}

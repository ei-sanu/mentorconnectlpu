import { Model } from 'mongoose';
import { StudentProfileDocument } from '../database/schemas/student-profile.schema';
import { MentorProfileDocument } from '../database/schemas/mentor-profile.schema';
import { AvailabilityDocument } from '../database/schemas/availability.schema';
import { SystemConfigDocument } from '../database/schemas/system-config.schema';
export interface MatchingWeights {
    semanticSimilarity: number;
    careerGoal: number;
    expertise: number;
    industry: number;
    targetRole: number;
    availability: number;
}
export declare class MatchingService {
    private readonly studentProfileModel;
    private readonly mentorProfileModel;
    private readonly availabilityModel;
    private readonly configModel;
    private readonly logger;
    private ai;
    constructor(studentProfileModel: Model<StudentProfileDocument>, mentorProfileModel: Model<MentorProfileDocument>, availabilityModel: Model<AvailabilityDocument>, configModel: Model<SystemConfigDocument>);
    getMatchingWeights(): Promise<MatchingWeights>;
    generateEmbedding(text: string): Promise<number[]>;
    generateAndSaveStudentEmbedding(studentProfileId: string): Promise<void>;
    generateAndSaveMentorEmbedding(mentorProfileId: string): Promise<void>;
    calculateRecommendation(studentProfileId: string, mentorProfileId?: string): Promise<any[]>;
}

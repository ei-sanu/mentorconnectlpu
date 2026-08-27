import { Model } from 'mongoose';
import { MentorProfileDocument } from '../database/schemas/mentor-profile.schema';
import { AvailabilityDocument } from '../database/schemas/availability.schema';
import { UserDocument } from '../database/schemas/user.schema';
import { MentorQueryDto } from './dto/mentor-query.dto';
import { UpdateMentorProfileDto } from './dto/update-mentor-profile.dto';
import { JobsService } from '../jobs/jobs.service';
export declare class MentorsService {
    private readonly mentorProfileModel;
    private readonly availabilityModel;
    private readonly userModel;
    private readonly jobsService;
    constructor(mentorProfileModel: Model<MentorProfileDocument>, availabilityModel: Model<AvailabilityDocument>, userModel: Model<UserDocument>, jobsService: JobsService);
    findMany(query: MentorQueryDto, isAdminOrOfficer?: boolean): Promise<any>;
    findOne(id: string): Promise<any>;
    getAvailability(id: string): Promise<any>;
    getProfileByUserId(userId: string): Promise<any>;
    updateProfile(userId: string, dto: UpdateMentorProfileDto): Promise<any>;
    mapToPublicProfile(m: any): {
        id: any;
        userId: any;
        firstName: any;
        lastName: any;
        imageUrl: any;
        title: any;
        company: any;
        experienceYears: any;
        expertise: any;
        industry: any;
        graduationYear: any;
        programme: any;
        capacity: {
            max: any;
            current: any;
        };
        acceptingMentees: boolean;
    };
}

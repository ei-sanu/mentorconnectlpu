import { MentorsService } from './mentors.service';
import { MentorQueryDto } from './dto/mentor-query.dto';
import { UpdateMentorProfileDto } from './dto/update-mentor-profile.dto';
export declare class MentorsController {
    private readonly mentorsService;
    constructor(mentorsService: MentorsService);
    getMentors(query: MentorQueryDto): Promise<any>;
    getMyProfile(user: any): Promise<any>;
    updateMyProfile(user: any, dto: UpdateMentorProfileDto): Promise<any>;
    getMentorById(id: string): Promise<any>;
    getMentorAvailability(id: string): Promise<any>;
}

import { Model } from 'mongoose';
import { StudentProfileDocument } from '../database/schemas/student-profile.schema';
import { UserDocument } from '../database/schemas/user.schema';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';
import { UpdateStudentCareerDto } from './dto/update-student-career.dto';
import { JobsService } from '../jobs/jobs.service';
export declare class StudentsService {
    private readonly studentProfileModel;
    private readonly userModel;
    private readonly jobsService;
    constructor(studentProfileModel: Model<StudentProfileDocument>, userModel: Model<UserDocument>, jobsService: JobsService);
    getProfileByUserId(userId: string): Promise<any>;
    updateProfile(userId: string, dto: UpdateStudentProfileDto): Promise<any>;
    updateCareer(userId: string, dto: UpdateStudentCareerDto): Promise<any>;
    private calculateCompletion;
}

import { StudentsService } from './students.service';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';
import { UpdateStudentCareerDto } from './dto/update-student-career.dto';
export declare class StudentsController {
    private readonly studentsService;
    constructor(studentsService: StudentsService);
    getMyProfile(user: any): Promise<any>;
    updateMyProfile(user: any, dto: UpdateStudentProfileDto): Promise<any>;
    updateMyCareer(user: any, dto: UpdateStudentCareerDto): Promise<any>;
}

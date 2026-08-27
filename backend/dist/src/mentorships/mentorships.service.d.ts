import { Model, Connection } from 'mongoose';
import { MentorshipDocument, MentorshipStatus } from '../database/schemas/mentorship.schema';
import { MentorProfileDocument } from '../database/schemas/mentor-profile.schema';
import { StudentProfileDocument } from '../database/schemas/student-profile.schema';
export declare class MentorshipsService {
    private readonly mentorshipModel;
    private readonly mentorProfileModel;
    private readonly studentProfileModel;
    private readonly connection;
    constructor(mentorshipModel: Model<MentorshipDocument>, mentorProfileModel: Model<MentorProfileDocument>, studentProfileModel: Model<StudentProfileDocument>, connection: Connection);
    findAll(userId: string, role: string): Promise<any[]>;
    findOne(id: string, userId: string, isAdminOrOfficer?: boolean): Promise<any>;
    updateStatus(id: string, userId: string, status: MentorshipStatus): Promise<any>;
}

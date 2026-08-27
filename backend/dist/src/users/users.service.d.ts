import { Model } from 'mongoose';
import { UserDocument } from '../database/schemas/user.schema';
import { StudentProfileDocument } from '../database/schemas/student-profile.schema';
import { MentorProfileDocument } from '../database/schemas/mentor-profile.schema';
import { AlumniVerificationDocument } from '../database/schemas/alumni-verification.schema';
import { NotificationDocument } from '../database/schemas/notification.schema';
import { AuditLogDocument } from '../database/schemas/audit-log.schema';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersService {
    private readonly userModel;
    private readonly studentProfileModel;
    private readonly mentorProfileModel;
    private readonly verificationModel;
    private readonly notificationModel;
    private readonly auditLogModel;
    constructor(userModel: Model<UserDocument>, studentProfileModel: Model<StudentProfileDocument>, mentorProfileModel: Model<MentorProfileDocument>, verificationModel: Model<AlumniVerificationDocument>, notificationModel: Model<NotificationDocument>, auditLogModel: Model<AuditLogDocument>);
    findOne(id: string): Promise<any>;
    findByClerkId(clerkUserId: string): Promise<any>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<any>;
    getUserProfile(user: any): Promise<any>;
    submitOnboarding(userId: string, data: any): Promise<any>;
}

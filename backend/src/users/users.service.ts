import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, Role, UserStatus } from '../database/schemas/user.schema';
import { StudentProfile, StudentProfileDocument } from '../database/schemas/student-profile.schema';
import { MentorProfile, MentorProfileDocument, VerificationStatus, MentorStatus } from '../database/schemas/mentor-profile.schema';
import { AlumniVerification, AlumniVerificationDocument } from '../database/schemas/alumni-verification.schema';
import { Notification, NotificationDocument } from '../database/schemas/notification.schema';
import { AuditLog, AuditLogDocument } from '../database/schemas/audit-log.schema';
import { UpdateUserDto } from './dto/update-user.dto';
import { globalEventBus } from '../common/event-bus';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(StudentProfile.name) private readonly studentProfileModel: Model<StudentProfileDocument>,
    @InjectModel(MentorProfile.name) private readonly mentorProfileModel: Model<MentorProfileDocument>,
    @InjectModel(AlumniVerification.name) private readonly verificationModel: Model<AlumniVerificationDocument>,
    @InjectModel(Notification.name) private readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(AuditLog.name) private readonly auditLogModel: Model<AuditLogDocument>,
  ) {}

  async findOne(id: string): Promise<any> {
    const user = await this.userModel.findById(id).lean();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const studentProfile = await this.studentProfileModel.findOne({ userId: id }).lean();
    const mentorProfile = await this.mentorProfileModel.findOne({ userId: id }).lean();

    let profileCompletion = 0;
    if (user.role === 'STUDENT' && studentProfile) {
      let score = 0;
      if (user.firstName && user.lastName && user.phone) score += 20;
      if (studentProfile.programme && studentProfile.school && studentProfile.yearOfStudy) score += 25;
      if (studentProfile.currentSkills && studentProfile.currentSkills.length > 0 && studentProfile.targetRole) score += 20;
      if (studentProfile.preferredFrequency && studentProfile.mentoringNeeds) score += 20;
      if (user.onboardingStatus === 'APPROVED' || user.onboardingStatus === 'SUBMITTED' || user.onboardingStatus === 'UNDER_REVIEW') score += 15;
      profileCompletion = score;
    } else if (user.role === 'MENTOR' && mentorProfile) {
      let score = 0;
      if (user.firstName && user.lastName && user.phone) score += 20;
      if (mentorProfile.programme && mentorProfile.graduationYear) score += 25;
      if (mentorProfile.currentCompany && mentorProfile.currentDesignation && mentorProfile.yearsOfExperience) score += 20;
      if (mentorProfile.expertise && mentorProfile.expertise.length > 0) score += 20;
      if (mentorProfile.verificationStatus === 'VERIFIED' || user.onboardingStatus === 'SUBMITTED' || user.onboardingStatus === 'UNDER_REVIEW') score += 15;
      profileCompletion = score;
    }

    return {
      ...user,
      id: user._id.toString(),
      studentProfile: studentProfile ? { ...studentProfile, id: studentProfile._id.toString() } : null,
      mentorProfile: mentorProfile ? { ...mentorProfile, id: mentorProfile._id.toString() } : null,
      profileCompletion,
    };
  }

  async findByClerkId(clerkUserId: string): Promise<any> {
    const user = await this.userModel.findOne({ clerkUserId }).lean();
    if (!user) return null;

    const studentProfile = await this.studentProfileModel.findOne({ userId: user._id }).lean();
    const mentorProfile = await this.mentorProfileModel.findOne({ userId: user._id }).lean();

    let profileCompletion = 0;
    if (user.role === 'STUDENT' && studentProfile) {
      let score = 0;
      if (user.firstName && user.lastName && user.phone) score += 20;
      if (studentProfile.programme && studentProfile.school && studentProfile.yearOfStudy) score += 25;
      if (studentProfile.currentSkills && studentProfile.currentSkills.length > 0 && studentProfile.targetRole) score += 20;
      if (studentProfile.preferredFrequency && studentProfile.mentoringNeeds) score += 20;
      if (user.onboardingStatus === 'APPROVED' || user.onboardingStatus === 'SUBMITTED' || user.onboardingStatus === 'UNDER_REVIEW') score += 15;
      profileCompletion = score;
    } else if (user.role === 'MENTOR' && mentorProfile) {
      let score = 0;
      if (user.firstName && user.lastName && user.phone) score += 20;
      if (mentorProfile.programme && mentorProfile.graduationYear) score += 25;
      if (mentorProfile.currentCompany && mentorProfile.currentDesignation && mentorProfile.yearsOfExperience) score += 20;
      if (mentorProfile.expertise && mentorProfile.expertise.length > 0) score += 20;
      if (mentorProfile.verificationStatus === 'VERIFIED' || user.onboardingStatus === 'SUBMITTED' || user.onboardingStatus === 'UNDER_REVIEW') score += 15;
      profileCompletion = score;
    }

    return {
      ...user,
      id: user._id.toString(),
      studentProfile: studentProfile ? { ...studentProfile, id: studentProfile._id.toString() } : null,
      mentorProfile: mentorProfile ? { ...mentorProfile, id: mentorProfile._id.toString() } : null,
      profileCompletion,
    };
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<any> {
    const updated = await this.userModel
      .findByIdAndUpdate(id, { $set: updateUserDto }, { new: true })
      .lean();

    if (!updated) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return {
      ...updated,
      id: updated._id.toString(),
    };
  }

  async getUserProfile(user: any): Promise<any> {
    const userId = user.id || user._id;
    if (user.role === 'STUDENT') {
      const student = await this.studentProfileModel.findOne({ userId }).lean();
      return { role: 'STUDENT', profile: student ? { ...student, id: student._id.toString() } : null };
    } else if (user.role === 'MENTOR') {
      const mentor = await this.mentorProfileModel.findOne({ userId }).lean();
      return { role: 'MENTOR', profile: mentor ? { ...mentor, id: mentor._id.toString() } : null };
    }
    return { role: user.role, profile: null };
  }

  async submitOnboarding(userId: string, data: any): Promise<any> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Role safety validation: only allow legitimate self-service roles (STUDENT or MENTOR)
    const targetRole = data.role === 'MENTOR' ? Role.MENTOR : Role.STUDENT;

    // Normalize Registration Number
    const regNum = data.lpuRegistrationNumber?.trim();
    const normalizedReg = regNum ? regNum.toUpperCase() : null;

    if (normalizedReg) {
      // Prevent multiple accounts claiming same registration number
      const duplicateUser = await this.userModel.findOne({
        lpuRegistrationNumberNormalized: normalizedReg,
        _id: { $ne: user._id }
      });
      if (duplicateUser) {
        throw new BadRequestException('This LPU Registration Number is already claimed by another account.');
      }
      user.lpuRegistrationNumber = regNum;
      user.lpuRegistrationNumberNormalized = normalizedReg;
    }

    // Update user properties
    user.phone = data.phone;
    user.lpuEmail = data.lpuEmail;
    user.role = targetRole;
    user.onboardingStatus = 'UNDER_REVIEW';
    user.verificationStatus = 'PENDING';
    user.firstName = data.firstName || user.firstName;
    user.lastName = data.lastName || user.lastName;
    await user.save();

    // Create or update role-specific profiles
    if (targetRole === Role.STUDENT) {
      let student = await this.studentProfileModel.findOne({ userId: user._id });
      if (!student) {
        student = new this.studentProfileModel({ userId: user._id });
      }
      student.programme = data.programme || 'B.Tech';
      student.school = data.school || 'LPU';
      student.yearOfStudy = data.yearOfStudy ? parseInt(data.yearOfStudy, 10) : 1;
      student.graduationYear = data.graduationYear ? parseInt(data.graduationYear, 10) : new Date().getFullYear() + 3;
      student.currentSkills = data.skills || [];
      student.targetRole = data.targetRole || 'Software Engineer';
      student.targetIndustry = data.targetIndustry || 'Technology';
      student.careerGoals = data.careerGoals || [];
      student.interests = data.interests || [];
      student.mentoringNeeds = data.mentoringNeeds || 'Career planning';
      student.preferredFrequency = data.preferredFrequency || 'Weekly';
      student.onboardingStatus = true;
      await student.save();
    } else if (targetRole === Role.MENTOR) {
      let mentor = await this.mentorProfileModel.findOne({ userId: user._id });
      if (!mentor) {
        mentor = new this.mentorProfileModel({ userId: user._id });
      }
      mentor.graduationYear = data.graduationYear ? parseInt(data.graduationYear, 10) : new Date().getFullYear() - 2;
      mentor.programme = data.programme || 'B.Tech';
      mentor.currentCompany = data.currentCompany || 'LPU';
      mentor.currentDesignation = data.currentDesignation || 'Alumnus';
      mentor.yearsOfExperience = data.yearsOfExperience ? parseInt(data.yearsOfExperience, 10) : 1;
      mentor.industry = data.industry || 'Technology';
      mentor.expertise = data.expertise || [];
      mentor.mentoringAreas = data.mentoringAreas || [];
      mentor.bio = data.bio || 'LPU Alumnus';
      mentor.careerSummary = data.careerSummary || 'LPU Alumnus Professional';
      mentor.verificationStatus = VerificationStatus.PENDING;
      mentor.status = MentorStatus.INACTIVE; // inactive until verified by admin
      await mentor.save();

      // Create AlumniVerification record
      const verification = new this.verificationModel({
        mentorProfileId: mentor._id,
        submittedData: {
          registrationNumber: regNum,
          programme: data.programme,
          school: data.school,
          graduationYear: data.graduationYear,
          lpuEmail: data.lpuEmail,
          proofDocumentUrl: data.proofDocumentUrl || 'https://picsum.photos/200/300',
        },
        status: VerificationStatus.PENDING,
      });
      await verification.save();
    }

    // Notify admins of new onboarding verification request
    const notificationText = targetRole === Role.STUDENT 
      ? `New student verification submitted by ${user.firstName} ${user.lastName} (${regNum})`
      : `New alumni mentor verification submitted by ${user.firstName} ${user.lastName} (${regNum})`;

    const admins = await this.userModel.find({ role: Role.ADMIN }).lean();
    for (const admin of admins) {
      const adminNotif = new this.notificationModel({
        userId: admin._id,
        type: 'NEW_ONBOARDING',
        title: 'New Verification Request',
        message: notificationText,
        read: false,
        metadata: { applicantId: user._id.toString(), role: targetRole }
      });
      await adminNotif.save();
    }

    // Log to Audit Trail
    const auditLog = new this.auditLogModel({
      actorId: user._id,
      action: 'ONBOARDING_SUBMITTED',
      entity: 'User',
      entityId: user._id.toString(),
      metadata: { role: targetRole, regNum },
    });
    await auditLog.save();

    globalEventBus.emit('dashboard_update', {
      type: 'USER_ONBOARDED',
      targetRole: targetRole === Role.MENTOR ? 'MENTOR' : 'STUDENT',
    });

    return { success: true, onboardingStatus: 'UNDER_REVIEW' };
  }
}

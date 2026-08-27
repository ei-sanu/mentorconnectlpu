import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { StudentProfile, StudentProfileDocument } from '../database/schemas/student-profile.schema';
import { User, UserDocument } from '../database/schemas/user.schema';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';
import { UpdateStudentCareerDto } from './dto/update-student-career.dto';
import { JobsService } from '../jobs/jobs.service';

@Injectable()
export class StudentsService {
  constructor(
    @InjectModel(StudentProfile.name)
    private readonly studentProfileModel: Model<StudentProfileDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @Inject(forwardRef(() => JobsService))
    private readonly jobsService: JobsService,
  ) {}

  async getProfileByUserId(userId: string): Promise<any> {
    const profile = await this.studentProfileModel
      .findOne({ userId })
      .populate('userId')
      .lean();

    if (!profile) {
      throw new NotFoundException(`Student profile not found for user ${userId}`);
    }

    return {
      ...profile,
      id: profile._id.toString(),
      user: {
        ...(profile.userId as any),
        id: (profile.userId as any)._id?.toString(),
      },
    };
  }

  async updateProfile(userId: string, dto: UpdateStudentProfileDto): Promise<any> {
    const existing = await this.studentProfileModel.findOne({ userId }).lean();

    let profile;
    if (existing) {
      const completion = this.calculateCompletion({ ...existing, ...dto });
      profile = await this.studentProfileModel
        .findOneAndUpdate({ userId }, { $set: { ...dto, profileCompletion: completion } }, { new: true })
        .lean();
    } else {
      const completion = this.calculateCompletion(dto);
      const created = new this.studentProfileModel({
        userId,
        programme: dto.programme || '',
        school: dto.school || '',
        yearOfStudy: dto.yearOfStudy || 1,
        graduationYear: dto.graduationYear || new Date().getFullYear() + 4,
        interests: dto.interests || [],
        mentoringNeeds: dto.mentoringNeeds || '',
        preferredFrequency: dto.preferredFrequency || '',
        targetRole: '',
        targetIndustry: '',
        profileCompletion: completion,
      });
      const saved = await created.save();
      profile = saved.toObject();
    }

    const profileIdStr = profile._id.toString();
    await this.jobsService.queueStudentEmbedding(profileIdStr);

    return {
      ...profile,
      id: profileIdStr,
    };
  }

  async updateCareer(userId: string, dto: UpdateStudentCareerDto): Promise<any> {
    const existing = await this.studentProfileModel.findOne({ userId }).lean();

    let profile;
    if (!existing) {
      const completion = this.calculateCompletion(dto);
      const created = new this.studentProfileModel({
        userId,
        programme: '',
        school: '',
        yearOfStudy: 1,
        graduationYear: new Date().getFullYear() + 4,
        interests: [],
        mentoringNeeds: '',
        preferredFrequency: '',
        careerGoals: dto.careerGoals || [],
        targetRole: dto.targetRole || '',
        targetIndustry: dto.targetIndustry || '',
        currentSkills: dto.currentSkills || [],
        profileCompletion: completion,
      });
      const saved = await created.save();
      profile = saved.toObject();
    } else {
      const completion = this.calculateCompletion({ ...existing, ...dto });
      profile = await this.studentProfileModel
        .findOneAndUpdate({ userId }, { $set: { ...dto, profileCompletion: completion } }, { new: true })
        .lean();
    }

    const profileIdStr = profile._id.toString();
    await this.jobsService.queueStudentEmbedding(profileIdStr);

    return {
      ...profile,
      id: profileIdStr,
    };
  }

  private calculateCompletion(p: any): number {
    let score = 0;
    if (p.programme) score += 10;
    if (p.school) score += 10;
    if (p.yearOfStudy) score += 10;
    if (p.graduationYear) score += 10;
    if (p.interests && p.interests.length > 0) score += 15;
    if (p.mentoringNeeds) score += 15;
    if (p.targetRole) score += 10;
    if (p.targetIndustry) score += 10;
    if (p.currentSkills && p.currentSkills.length > 0) score += 10;
    return Math.min(score, 100);
  }
}

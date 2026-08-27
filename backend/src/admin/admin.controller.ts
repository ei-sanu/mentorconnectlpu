import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, Role } from '../database/schemas/user.schema';
import { MentorProfile, MentorProfileDocument } from '../database/schemas/mentor-profile.schema';
import { StudentProfile, StudentProfileDocument } from '../database/schemas/student-profile.schema';
import { AlumniVerification, AlumniVerificationDocument } from '../database/schemas/alumni-verification.schema';
import { SystemConfig, SystemConfigDocument } from '../database/schemas/system-config.schema';
import { AuditService } from '../audit/audit.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { MatchingWeights } from '../matching/matching.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Admin Console')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(MentorProfile.name) private readonly mentorProfileModel: Model<MentorProfileDocument>,
    @InjectModel(StudentProfile.name) private readonly studentProfileModel: Model<StudentProfileDocument>,
    @InjectModel(AlumniVerification.name) private readonly verificationModel: Model<AlumniVerificationDocument>,
    @InjectModel(SystemConfig.name) private readonly configModel: Model<SystemConfigDocument>,
    private readonly audit: AuditService,
    private readonly analytics: AnalyticsService,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Admin overview dashboard statistics' })
  async getDashboard(): Promise<any> {
    const stats = await this.analytics.getAdminDashboardMetrics();
    return { success: true, data: stats };
  }

  @Get('users')
  @ApiOperation({ summary: 'List all registered platform users' })
  async getUsers(): Promise<any> {
    const users = await this.userModel.find().sort({ createdAt: -1 }).lean();
    return {
      success: true,
      data: users.map((u) => ({ ...u, id: u._id.toString() })),
    };
  }

  @Get('mentors')
  @ApiOperation({ summary: 'List all mentor profiles' })
  async getMentors(): Promise<any> {
    const mentors = await this.mentorProfileModel
      .find()
      .populate('userId')
      .sort({ createdAt: -1 })
      .lean();

    return {
      success: true,
      data: mentors.map((m: any) => ({
        ...m,
        id: m._id.toString(),
        user: m.userId ? { ...m.userId, id: m.userId._id?.toString() } : null,
      })),
    };
  }

  @Get('students')
  @ApiOperation({ summary: 'List all student profiles' })
  async getStudents(): Promise<any> {
    const students = await this.studentProfileModel
      .find()
      .populate('userId')
      .sort({ createdAt: -1 })
      .lean();

    return {
      success: true,
      data: students.map((s: any) => ({
        ...s,
        id: s._id.toString(),
        user: s.userId ? { ...s.userId, id: s.userId._id?.toString() } : null,
      })),
    };
  }

  @Get('verification')
  @ApiOperation({ summary: 'List all alumni verification requests' })
  async getVerifications(): Promise<any> {
    const verifications = await this.verificationModel
      .find()
      .populate({
        path: 'mentorProfileId',
        populate: { path: 'userId' },
      })
      .sort({ createdAt: -1 })
      .lean();

    return {
      success: true,
      data: verifications.map((v: any) => ({
        ...v,
        id: v._id.toString(),
        mentorProfile: v.mentorProfileId
          ? {
              ...v.mentorProfileId,
              id: v.mentorProfileId._id?.toString(),
              user: v.mentorProfileId.userId
                ? {
                    ...v.mentorProfileId.userId,
                    id: v.mentorProfileId.userId._id?.toString(),
                  }
                : null,
            }
          : null,
      })),
    };
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get detailed system analytics' })
  async getAnalytics(): Promise<any> {
    const stats = await this.analytics.getAdminDashboardMetrics();
    return { success: true, data: stats };
  }

  @Get('matching/config')
  @ApiOperation({ summary: 'Read central AI matching weights config' })
  async getMatchingConfig(): Promise<any> {
    const config = await this.configModel.findOne({ key: 'MATCHING_WEIGHTS' }).lean();

    if (config) {
      return { success: true, data: config.value };
    }

    return {
      success: true,
      data: {
        semanticSimilarity: 35,
        careerGoal: 20,
        expertise: 15,
        industry: 10,
        targetRole: 10,
        availability: 10,
      },
    };
  }

  @Patch('matching/config')
  @ApiOperation({ summary: 'Modify central AI matching weights config' })
  async updateMatchingConfig(@CurrentUser() admin: any, @Body() dto: MatchingWeights): Promise<any> {
    const sum =
      (dto.semanticSimilarity || 0) +
      (dto.careerGoal || 0) +
      (dto.expertise || 0) +
      (dto.industry || 0) +
      (dto.targetRole || 0) +
      (dto.availability || 0);

    if (sum !== 100) {
      throw new BadRequestException(`Matching configuration weights must total exactly 100. Current total: ${sum}`);
    }

    const config = await this.configModel.findOneAndUpdate(
      { key: 'MATCHING_WEIGHTS' },
      { $set: { value: dto } },
      { upsert: true, new: true },
    ).lean();

    await this.audit.log(
      admin.id,
      'UPDATE_MATCHING_CONFIG',
      'SystemConfig',
      'MATCHING_WEIGHTS',
      dto,
    );

    return { success: true, data: config.value };
  }

  @Get('user-growth')
  @ApiOperation({ summary: 'Get user growth analytics grouped by date' })
  async getUserGrowth(@Query('days') days?: string): Promise<any> {
    const period = days ? parseInt(days, 10) : 30;
    const growth = await this.analytics.getUserGrowth(period);
    return { success: true, data: growth };
  }

  @Get('verification-overview')
  @ApiOperation({ summary: 'Get summary status counts for students and mentors' })
  async getVerificationOverview(): Promise<any> {
    const overview = await this.analytics.getVerificationOverview();
    return { success: true, data: overview };
  }

  @Get('mentorship-overview')
  @ApiOperation({ summary: 'Get counts of active, completed, and paused mentorships' })
  async getMentorshipOverview(): Promise<any> {
    const overview = await this.analytics.getMentorshipOverview();
    return { success: true, data: overview };
  }

  @Get('mentor-utilization')
  @ApiOperation({ summary: 'Get mentee capacity and utilization statistics' })
  async getMentorUtilization(): Promise<any> {
    const utilization = await this.analytics.getMentorUtilization();
    return { success: true, data: utilization };
  }

  @Get('matching-overview')
  @ApiOperation({ summary: 'Get AI recommendation and match statistics' })
  async getMatchingOverview(): Promise<any> {
    const overview = await this.analytics.getMatchingOverview();
    return { success: true, data: overview };
  }

  @Get('top-skills')
  @ApiOperation({ summary: 'Get top requested student skills and mentor expertise' })
  async getTopSkills(): Promise<any> {
    const skills = await this.analytics.getTopSkills();
    return { success: true, data: skills };
  }

  @Get('top-industries')
  @ApiOperation({ summary: 'Get top student target industries and mentor industries' })
  async getTopIndustries(): Promise<any> {
    const industries = await this.analytics.getTopIndustries();
    return { success: true, data: industries };
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Get recent platform audit logs' })
  async getAuditLogs(@Query('limit') limit?: string): Promise<any> {
    const size = limit ? parseInt(limit, 10) : 50;
    const logs = await this.audit.findAll(size);
    return { success: true, data: logs };
  }
}

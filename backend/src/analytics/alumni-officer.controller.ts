import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AnalyticsService } from '../analytics/analytics.service';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import {
  AlumniVerification,
  AlumniVerificationDocument,
} from '../database/schemas/alumni-verification.schema';
import {
  MentorProfile,
  MentorProfileDocument,
  VerificationStatus,
} from '../database/schemas/mentor-profile.schema';

import { Role } from '../database/schemas/user.schema';

@ApiTags('Alumni Officer')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard, RolesGuard)
@Roles(Role.ALUMNI_OFFICER, Role.ADMIN)
@Controller('alumni-officer')
export class AlumniOfficerController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    @InjectModel(AlumniVerification.name)
    private readonly verificationModel: Model<AlumniVerificationDocument>,
    @InjectModel(MentorProfile.name)
    private readonly mentorProfileModel: Model<MentorProfileDocument>,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Alumni officer overview metrics (real aggregates)' })
  async getDashboard(): Promise<any> {
    const data = await this.analyticsService.getAlumniOfficerDashboard();
    return { success: true, data };
  }

  /**
   * Paginated & searchable alumni verifications.
   * Sensitive fields (registration numbers, document URLs) are never returned.
   */
  @Get('verifications')
  @ApiOperation({ summary: 'List alumni verifications (paginated, searchable)' })
  async getVerifications(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('status') status?: string,
    @Query('q') q?: string,
  ): Promise<any> {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

    const validStatuses = Object.values(VerificationStatus);
    const statusFilter = status && validStatuses.includes(status as VerificationStatus) ? status : undefined;

    const mentorProfiles = this.mentorProfileModel.collection.name;
    const users = this.verificationModel.db.model('User').collection.name;

    const pipeline: any[] = [
      {
        $lookup: {
          from: mentorProfiles,
          localField: 'mentorProfileId',
          foreignField: '_id',
          as: 'mp',
        },
      },
      { $unwind: { path: '$mp', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: users,
          localField: 'mp.userId',
          foreignField: '_id',
          as: 'u',
        },
      },
      { $unwind: { path: '$u', preserveNullAndEmptyArrays: true } },
    ];

    if (statusFilter) {
      pipeline.push({ $match: { status: statusFilter } });
    }

    if (q && q.trim()) {
      const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      pipeline.push({
        $match: {
          $or: [
            { 'u.firstName': rx },
            { 'u.lastName': rx },
            { 'u.email': rx },
            { 'mp.currentCompany': rx },
            { 'mp.currentDesignation': rx },
          ],
        },
      });
    }

    pipeline.push({ $sort: { createdAt: -1 } });

    const [result] = await this.verificationModel.aggregate([
      ...pipeline,
      {
        $facet: {
          items: [
            { $skip: (pageNum - 1) * limitNum },
            { $limit: limitNum },
            {
              $project: {
                _id: 1,
                status: 1,
                createdAt: 1,
                updatedAt: 1,
                mentorName: {
                  $trim: { input: { $concat: ['$u.firstName', ' ', '$u.lastName'] } },
                },
                email: '$u.email',
                company: { $ifNull: ['$mp.currentCompany', '—'] },
                designation: { $ifNull: ['$mp.currentDesignation', '—'] },
                programme: { $ifNull: ['$mp.programme', '—'] },
                graduationYear: '$mp.graduationYear',
              },
            },
          ],
          total: [{ $count: 'count' }],
        },
      },
    ]);

    // Status breakdown counts for filter tabs
    const statusCounts = await this.verificationModel.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const countsByStatus: Record<string, number> = {};
    for (const row of statusCounts) countsByStatus[row._id] = row.count;

    return {
      success: true,
      data: result.items.map((i: any) => ({ ...i, id: i._id.toString(), _id: undefined })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: result.total[0]?.count ?? 0,
        totalPages: Math.ceil((result.total[0]?.count ?? 0) / limitNum),
      },
      statusCounts: countsByStatus,
    };
  }

  /** Paginated & searchable verified alumni mentors. */
  @Get('mentors')
  @ApiOperation({ summary: 'List alumni mentors (paginated, searchable)' })
  async getMentors(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('q') q?: string,
  ): Promise<any> {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

    const users = this.mentorProfileModel.db.model('User').collection.name;

    const matchStage: any[] = [];
    if (q && q.trim()) {
      const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      matchStage.push({
        $match: {
          $or: [
            { 'u.firstName': rx },
            { 'u.lastName': rx },
            { 'u.email': rx },
            { '$mp.currentCompany': rx },
            { currentCompany: rx },
            { industry: rx },
            { currentDesignation: rx },
          ],
        },
      });
    }

    const [result] = await this.mentorProfileModel.aggregate([
      {
        $lookup: {
          from: users,
          localField: 'userId',
          foreignField: '_id',
          as: 'u',
        },
      },
      { $unwind: { path: '$u', preserveNullAndEmptyArrays: true } },
      ...matchStage,
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          items: [
            { $skip: (pageNum - 1) * limitNum },
            { $limit: limitNum },
            {
              $project: {
                _id: 1,
                mentorName: {
                  $trim: { input: { $concat: ['$u.firstName', ' ', '$u.lastName'] } },
                },
                email: '$u.email',
                currentCompany: 1,
                currentDesignation: 1,
                industry: 1,
                yearsOfExperience: 1,
                verificationStatus: 1,
                acceptingMentees: 1,
                maxCapacity: 1,
                currentMenteesCount: 1,
                graduationYear: 1,
                createdAt: 1,
              },
            },
          ],
          total: [{ $count: 'count' }],
        },
      },
    ]);

    return {
      success: true,
      data: result.items.map((i: any) => ({ ...i, id: i._id.toString() })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: result.total[0]?.count ?? 0,
        totalPages: Math.ceil((result.total[0]?.count ?? 0) / limitNum),
      },
    };
  }
}

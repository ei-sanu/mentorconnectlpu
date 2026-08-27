import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AnalyticsService } from '../analytics/analytics.service';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import {
  StudentProfile,
  StudentProfileDocument,
} from '../database/schemas/student-profile.schema';
import { Role } from '../database/schemas/user.schema';
import { Opportunity, OpportunityDocument, OpportunityStatus } from '../database/schemas/opportunity.schema';
import { PlacementApplication, PlacementApplicationDocument, PlacementStatus } from '../database/schemas/placement-application.schema';
import { globalEventBus } from '../common/event-bus';

@ApiTags('Placement Officer')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard, RolesGuard)
@Roles(Role.PLACEMENT_OFFICER, Role.ADMIN)
@Controller('placement-officer')
export class PlacementOfficerController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    @InjectModel(StudentProfile.name)
    private readonly studentProfileModel: Model<StudentProfileDocument>,
    @InjectModel(Opportunity.name)
    private readonly opportunityModel: Model<OpportunityDocument>,
    @InjectModel(PlacementApplication.name)
    private readonly placementApplicationModel: Model<PlacementApplicationDocument>,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Placement officer overview metrics (real aggregates)' })
  async getDashboard(): Promise<any> {
    const data = await this.analyticsService.getPlacementOfficerDashboard();
    return { success: true, data };
  }

  /**
   * Paginated & searchable student career profiles.
   * Contact details (phone, registration numbers) are never returned.
   */
  @Get('students')
  @ApiOperation({ summary: 'List student career profiles (paginated, searchable)' })
  async getStudents(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('q') q?: string,
    @Query('industry') industry?: string,
  ): Promise<any> {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

    const users = this.studentProfileModel.db.model('User').collection.name;

    const matchStage: any[] = [];
    if (industry && industry.trim()) {
      matchStage.push({ $match: { targetIndustry: industry.trim() } });
    }
    if (q && q.trim()) {
      const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      matchStage.push({
        $match: {
          $or: [
            { 'u.firstName': rx },
            { 'u.lastName': rx },
            { 'u.email': rx },
            { targetRole: rx },
            { targetIndustry: rx },
            { currentSkills: rx },
          ],
        },
      });
    }

    const [result] = await this.studentProfileModel.aggregate([
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
                studentName: {
                  $trim: { input: { $concat: ['$u.firstName', ' ', '$u.lastName'] } },
                },
                programme: 1,
                school: 1,
                yearOfStudy: 1,
                graduationYear: 1,
                targetRole: 1,
                targetIndustry: 1,
                currentSkills: 1,
                profileCompletion: 1,
                preferredFrequency: 1,
                createdAt: 1,
                onboardingStatus: {
                  $cond: [
                    { $eq: ['$u.verificationStatus', 'VERIFIED'] },
                    'APPROVED',
                    {
                      $cond: [
                        { $eq: ['$u.verificationStatus', 'UNDER_REVIEW'] },
                        'UNDER_REVIEW',
                        {
                          $cond: [
                            { $eq: ['$u.verificationStatus', 'REJECTED'] },
                            'REJECTED',
                            'CHANGES_REQUESTED'
                          ]
                        }
                      ]
                    }
                  ]
                },
              },
            },
          ],
          total: [{ $count: 'count' }],
        },
      },
    ]);

    // Industry filter options derived from real student data
    const industries = await this.studentProfileModel.aggregate([
      { $match: { targetIndustry: { $ne: '' } } },
      { $group: { _id: '$targetIndustry', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 15 },
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
      industryFilters: industries.map((i) => ({ industry: i._id, count: i.count })),
    };
  }

  @Get('opportunities')
  @ApiOperation({ summary: 'List all placement opportunities (paginated)' })
  async getOpportunities(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('status') status?: string,
  ): Promise<any> {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

    const filter: Record<string, any> = {};
    if (status) {
      filter.status = status;
    }

    const [items, total] = await Promise.all([
      this.opportunityModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      this.opportunityModel.countDocuments(filter),
    ]);

    return {
      success: true,
      data: items.map((i: any) => ({ ...i, id: i._id.toString() })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  @Post('opportunities')
  @ApiOperation({ summary: 'Create a new placement opportunity' })
  async createOpportunity(@Body() body: any): Promise<any> {
    const opp = new this.opportunityModel(body);
    await opp.save();
    globalEventBus.emit('dashboard_update', { type: 'OPPORTUNITY_CREATED' });
    return { success: true, data: opp };
  }

  @Get('applications')
  @ApiOperation({ summary: 'List student placement applications' })
  async getApplications(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ): Promise<any> {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

    const pipeline: any[] = [
      {
        $lookup: {
          from: 'users',
          localField: 'studentId',
          foreignField: '_id',
          as: 'student',
        },
      },
      { $unwind: '$student' },
      {
        $lookup: {
          from: 'opportunities',
          localField: 'opportunityId',
          foreignField: '_id',
          as: 'opportunity',
        },
      },
      { $unwind: '$opportunity' },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          items: [
            { $skip: (pageNum - 1) * limitNum },
            { $limit: limitNum },
            {
              $project: {
                _id: 1,
                status: 1,
                interviewDate: 1,
                notes: 1,
                createdAt: 1,
                studentName: { $concat: ['$student.firstName', ' ', '$student.lastName'] },
                studentEmail: '$student.email',
                opportunityTitle: '$opportunity.title',
                opportunityCompany: '$opportunity.company',
              },
            },
          ],
          total: [{ $count: 'count' }],
        },
      },
    ];

    const [result] = await this.placementApplicationModel.aggregate(pipeline);

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

  @Patch('applications/:id')
  @ApiOperation({ summary: 'Update student application status' })
  async updateApplication(@Param('id') id: string, @Body() body: any): Promise<any> {
    const updated = await this.placementApplicationModel.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true }
    );
    globalEventBus.emit('dashboard_update', { type: 'APPLICATION_UPDATED' });
    return { success: true, data: updated };
  }

  @Get('students/:id')
  @ApiOperation({ summary: 'Get single student career profile detail' })
  async getStudentDetail(@Param('id') id: string): Promise<any> {
    const users = this.studentProfileModel.db.model('User').collection.name;

    const [profile] = await this.studentProfileModel.aggregate([
      { $match: { _id: new Types.ObjectId(id) } },
      {
        $lookup: {
          from: users,
          localField: 'userId',
          foreignField: '_id',
          as: 'u',
        },
      },
      { $unwind: '$u' },
      {
        $project: {
          _id: 1,
          studentName: { $concat: ['$u.firstName', ' ', '$u.lastName'] },
          email: '$u.email',
          programme: 1,
          school: 1,
          yearOfStudy: 1,
          graduationYear: 1,
          currentSkills: 1,
          targetRole: 1,
          targetIndustry: 1,
          careerGoals: 1,
          interests: 1,
          mentoringNeeds: 1,
          profileCompletion: 1,
          createdAt: 1,
        },
      },
    ]);

    if (!profile) {
      return { success: false, message: 'Student profile not found.' };
    }

    return { success: true, data: profile };
  }
}

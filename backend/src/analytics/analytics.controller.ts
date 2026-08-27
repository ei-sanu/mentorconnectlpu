import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../database/schemas/user.schema';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @Roles(Role.ADMIN, Role.ALUMNI_OFFICER, Role.PLACEMENT_OFFICER)
  @ApiOperation({ summary: 'Get overview dashboard metrics (Admins/Officers)' })
  async getDashboardMetrics() {
    const metrics = await this.analyticsService.getAdminDashboardMetrics();
    return { success: true, data: metrics };
  }
}

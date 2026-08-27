import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { GoalsService } from './goals.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Goals')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller()
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Get('mentorships/:id/goals')
  @ApiOperation({ summary: 'Get goals for a mentorship' })
  async getGoals(@Param('id') mentorshipId: string, @CurrentUser() user: any): Promise<any> {
    const list = await this.goalsService.findGoalsForMentorship(mentorshipId, user.id);
    return { success: true, data: list };
  }

  @Post('mentorships/:id/goals')
  @ApiOperation({ summary: 'Create goal for a mentorship' })
  async createGoal(
    @Param('id') mentorshipId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateGoalDto,
  ): Promise<any> {
    const goal = await this.goalsService.createGoal(mentorshipId, user.id, dto);
    return { success: true, data: goal };
  }

  @Patch('goals/:id')
  @ApiOperation({ summary: 'Update progress or details of goal' })
  async updateGoal(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: any): Promise<any> {
    const updated = await this.goalsService.updateGoal(id, user.id, dto);
    return { success: true, data: updated };
  }

  @Delete('goals/:id')
  @ApiOperation({ summary: 'Delete specific goal' })
  async deleteGoal(@Param('id') id: string, @CurrentUser() user: any): Promise<any> {
    const result = await this.goalsService.deleteGoal(id, user.id);
    return result;
  }
}

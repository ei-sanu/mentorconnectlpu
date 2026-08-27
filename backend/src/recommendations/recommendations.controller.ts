import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

@ApiTags('Recommendations')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Get('mentors')
  @ApiOperation({ summary: 'Get AI recommended mentors for logged-in student' })
  async getRecommendations(@CurrentUser() user: any): Promise<any> {
    const list = await this.recommendationsService.getRecommendedMentors(user.id);
    return { success: true, data: list };
  }

  @Get('mentors/:id')
  @ApiOperation({ summary: 'Get explainable match details for a specific mentor' })
  async getMatchDetails(@CurrentUser() user: any, @Param('id') mentorId: string): Promise<any> {
    const details = await this.recommendationsService.getMentorMatchDetails(user.id, mentorId);
    return { success: true, data: details };
  }

  @Post('recalculate')
  @ApiOperation({ summary: 'Invalidate recommendation caches' })
  async recalculate(@CurrentUser() user: any): Promise<any> {
    await this.recommendationsService.invalidateAllCaches();
    return { success: true, message: 'Recommendations cache invalidated.' };
  }
}

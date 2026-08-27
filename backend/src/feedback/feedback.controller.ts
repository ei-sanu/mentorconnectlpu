import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Feedback')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('mentorships/:id/feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @ApiOperation({ summary: 'Submit feedback for a completed/ongoing mentorship' })
  async createFeedback(
    @Param('id') mentorshipId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateFeedbackDto,
  ): Promise<any> {
    const feedback = await this.feedbackService.createFeedback(mentorshipId, user.id, dto);
    return { success: true, data: feedback };
  }

  @Get()
  @ApiOperation({ summary: 'Get all feedback records for a mentorship' })
  async getFeedback(@Param('id') mentorshipId: string, @CurrentUser() user: any): Promise<any> {
    const list = await this.feedbackService.getFeedback(mentorshipId, user.id);
    return { success: true, data: list };
  }
}

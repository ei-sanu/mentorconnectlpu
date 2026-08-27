import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Sessions')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller()
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get('mentorships/:id/sessions')
  @ApiOperation({ summary: 'Get all sessions for a mentorship relationship' })
  async getSessions(@Param('id') mentorshipId: string, @CurrentUser() user: any): Promise<any> {
    const list = await this.sessionsService.findSessionsForMentorship(mentorshipId, user.id);
    return { success: true, data: list };
  }

  @Post('mentorships/:id/sessions')
  @ApiOperation({ summary: 'Book a session for a mentorship (Student or Mentor)' })
  async createSession(
    @Param('id') mentorshipId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateSessionDto,
  ): Promise<any> {
    const session = await this.sessionsService.createSession(mentorshipId, user.id, dto);
    return { success: true, data: session };
  }

  @Patch('sessions/:id')
  @ApiOperation({ summary: 'Update or reschedule a session' })
  async updateSession(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: any): Promise<any> {
    const updated = await this.sessionsService.updateSession(id, user.id, dto);
    return { success: true, data: updated };
  }

  @Delete('sessions/:id')
  @ApiOperation({ summary: 'Cancel a session' })
  async cancelSession(@Param('id') id: string, @CurrentUser() user: any): Promise<any> {
    const cancelled = await this.sessionsService.cancelSession(id, user.id);
    return { success: true, data: cancelled };
  }
}

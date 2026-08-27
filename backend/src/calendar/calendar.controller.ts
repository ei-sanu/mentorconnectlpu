import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Calendar Integration')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get('google/callback')
  @ApiOperation({ summary: 'Callback URL for Google OAuth' })
  async googleCallback(@Query('code') code: string, @CurrentUser() user: any) {
    return this.calendarService.saveGoogleCredentials(user.id, code);
  }

  @Post('disconnect')
  @ApiOperation({ summary: 'Disconnect calendar OAuth integration' })
  async disconnect(@CurrentUser() user: any) {
    return this.calendarService.disconnect(user.id);
  }
}

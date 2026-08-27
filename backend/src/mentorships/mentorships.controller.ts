import { Controller, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { MentorshipsService } from './mentorships.service';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Mentorships')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('mentorships')
export class MentorshipsController {
  constructor(private readonly mentorshipsService: MentorshipsService) {}

  @Get()
  @ApiOperation({ summary: "Get all mentorships related to logged-in user" })
  async getAll(@CurrentUser() user: any): Promise<any> {
    const list = await this.mentorshipsService.findAll(user.id, user.role);
    return { success: true, data: list };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of specific mentorship' })
  async getOne(@Param('id') id: string, @CurrentUser() user: any): Promise<any> {
    const mentorship = await this.mentorshipsService.findOne(id, user.id);
    return { success: true, data: mentorship };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update mentorship status (e.g. Pause, Complete)' })
  async update(@Param('id') id: string, @CurrentUser() user: any, @Body('status') status: any): Promise<any> {
    const updated = await this.mentorshipsService.updateStatus(id, user.id, status);
    return { success: true, data: updated };
  }
}

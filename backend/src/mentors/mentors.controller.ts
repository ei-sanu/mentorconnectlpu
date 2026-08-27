import { Controller, Get, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { MentorsService } from './mentors.service';
import { MentorQueryDto } from './dto/mentor-query.dto';
import { UpdateMentorProfileDto } from './dto/update-mentor-profile.dto';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

@ApiTags('Mentors')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('mentors')
export class MentorsController {
  constructor(private readonly mentorsService: MentorsService) {}

  @Get()
  @ApiOperation({ summary: 'Search and filter mentors' })
  @ApiResponse({ status: 200, description: 'List of mentors with pagination.' })
  async getMentors(@Query() query: MentorQueryDto): Promise<any> {
    return this.mentorsService.findMany(query);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current mentor profile' })
  async getMyProfile(@CurrentUser() user: any): Promise<any> {
    const profile = await this.mentorsService.getProfileByUserId(user.id);
    return { success: true, data: profile };
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current mentor profile' })
  async updateMyProfile(@CurrentUser() user: any, @Body() dto: UpdateMentorProfileDto): Promise<any> {
    const updated = await this.mentorsService.updateProfile(user.id, dto);
    return { success: true, data: updated };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get mentor by profile ID' })
  async getMentorById(@Param('id') id: string): Promise<any> {
    const mentor = await this.mentorsService.findOne(id);
    return { success: true, data: mentor };
  }

  @Get(':id/availability')
  @ApiOperation({ summary: 'Get mentor availability slots' })
  async getMentorAvailability(@Param('id') id: string): Promise<any> {
    const availability = await this.mentorsService.getAvailability(id);
    return { success: true, data: availability };
  }
}

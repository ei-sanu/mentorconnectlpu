import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { StudentsService } from './students.service';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';
import { UpdateStudentCareerDto } from './dto/update-student-career.dto';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

@ApiTags('Students')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current student profile' })
  @ApiResponse({ status: 200, description: 'Student profile object.' })
  async getMyProfile(@CurrentUser() user: any): Promise<any> {
    const profile = await this.studentsService.getProfileByUserId(user.id);
    return { success: true, data: profile };
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current student profile' })
  @ApiResponse({ status: 200, description: 'Updated student profile.' })
  async updateMyProfile(@CurrentUser() user: any, @Body() dto: UpdateStudentProfileDto): Promise<any> {
    const updated = await this.studentsService.updateProfile(user.id, dto);
    return { success: true, data: updated };
  }

  @Patch('me/career')
  @ApiOperation({ summary: 'Update student career settings' })
  @ApiResponse({ status: 200, description: 'Updated student profile with career details.' })
  async updateMyCareer(@CurrentUser() user: any, @Body() dto: UpdateStudentCareerDto): Promise<any> {
    const updated = await this.studentsService.updateCareer(user.id, dto);
    return { success: true, data: updated };
  }
}

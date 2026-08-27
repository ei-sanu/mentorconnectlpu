import { Controller, Get, Post, Patch, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

@ApiTags('Me')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('me')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get current logged-in user info' })
  @ApiResponse({ status: 200, description: 'Current user object.' })
  async getMe(@CurrentUser() user: any): Promise<any> {
    const freshUser = await this.usersService.findOne(user.id);
    return { success: true, data: freshUser };
  }

  @Patch()
  @ApiOperation({ summary: 'Update current logged-in user info' })
  @ApiResponse({ status: 200, description: 'Updated user object.' })
  async updateMe(@CurrentUser() user: any, @Body() updateUserDto: UpdateUserDto): Promise<any> {
    const updated = await this.usersService.update(user.id, updateUserDto);
    return { success: true, data: updated };
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get profile details based on role' })
  @ApiResponse({ status: 200, description: 'Role-specific profile details.' })
  async getMyProfile(@CurrentUser() user: any): Promise<any> {
    const profile = await this.usersService.getUserProfile(user);
    return { success: true, data: profile };
  }

  @Post('onboard')
  @ApiOperation({ summary: 'Submit onboarding data for verification' })
  async submitOnboarding(@CurrentUser() user: any, @Body() data: any): Promise<any> {
    return this.usersService.submitOnboarding(user.id, data);
  }
}

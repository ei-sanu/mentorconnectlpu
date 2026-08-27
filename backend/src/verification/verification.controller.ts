import { Controller, Get, Post, Patch, Body, Param, UseGuards, Ip } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { SubmitVerificationDto } from './dto/submit-verification.dto';
import { RejectVerificationDto } from './dto/reject-verification.dto';
import { RequestChangesDto } from './dto/request-changes.dto';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { Role } from '../database/schemas/user.schema';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

@ApiTags('Alumni Verification')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Post()
  @ApiOperation({ summary: 'Submit alumni verification documents (Mentors)' })
  async submit(@CurrentUser() user: any, @Body() dto: SubmitVerificationDto): Promise<any> {
    const verification = await this.verificationService.submit(user.id, dto);
    return { success: true, data: verification };
  }

  @Get()
  @Roles(Role.ADMIN, Role.ALUMNI_OFFICER)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get all verification requests (Admins/Officers)' })
  async getAll(): Promise<any> {
    const list = await this.verificationService.findAll();
    return { success: true, data: list };
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.ALUMNI_OFFICER)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get details of specific verification request' })
  async getOne(@Param('id') id: string): Promise<any> {
    const v = await this.verificationService.findOne(id);
    return { success: true, data: v };
  }

  @Patch(':id/approve')
  @Roles(Role.ADMIN, Role.ALUMNI_OFFICER)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Approve alumni verification request' })
  async approve(@Param('id') id: string, @CurrentUser() reviewer: any): Promise<any> {
    const approved = await this.verificationService.approve(id, reviewer.id);
    return { success: true, data: approved };
  }

  @Patch(':id/reject')
  @Roles(Role.ADMIN, Role.ALUMNI_OFFICER)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Reject alumni verification request' })
  async reject(
    @Param('id') id: string,
    @CurrentUser() reviewer: any,
    @Body() dto: RejectVerificationDto,
  ): Promise<any> {
    const rejected = await this.verificationService.reject(id, reviewer.id, dto.rejectionReason);
    return { success: true, data: rejected };
  }

  @Patch(':id/request-changes')
  @Roles(Role.ADMIN, Role.ALUMNI_OFFICER)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Request changes on verification details' })
  async requestChanges(
    @Param('id') id: string,
    @CurrentUser() reviewer: any,
    @Body() dto: RequestChangesDto,
  ): Promise<any> {
    const changes = await this.verificationService.requestChanges(id, reviewer.id, dto.explanation);
    return { success: true, data: changes };
  }

  @Post('phone/send-otp')
  @ApiOperation({ summary: 'Send OTP verification code to phone number' })
  async sendOtp(
    @CurrentUser() user: any,
    @Body() body: { phoneNumber: string; countryCode: string },
    @Ip() ip: string,
  ): Promise<any> {
    const data = await this.verificationService.sendOtp(user.id, body.countryCode, body.phoneNumber, ip);
    return { success: true, data };
  }

  @Post('phone/resend-otp')
  @ApiOperation({ summary: 'Resend OTP verification code to phone number' })
  async resendOtp(@CurrentUser() user: any, @Ip() ip: string): Promise<any> {
    const data = await this.verificationService.resendOtp(user.id, ip);
    return { success: true, data };
  }

  @Post('phone/verify-otp')
  @ApiOperation({ summary: 'Verify OTP code' })
  async verifyOtp(
    @CurrentUser() user: any,
    @Body() body: { otp: string },
  ): Promise<any> {
    const data = await this.verificationService.verifyOtp(user.id, body.otp);
    return { success: true, data };
  }

  @Get('phone/status')
  @ApiOperation({ summary: 'Get phone verification status' })
  async getStatus(@CurrentUser() user: any): Promise<any> {
    const data = await this.verificationService.getPhoneVerificationStatus(user.id);
    return { success: true, data };
  }

  @Post('phone/verify-widget-token')
  @ApiOperation({ summary: 'Verify MSG91 widget token returned by otp-provider.js success callback' })
  async verifyWidgetToken(
    @CurrentUser() user: any,
    @Body() body: { token: string },
  ): Promise<any> {
    if (!body?.token) {
      return { success: false, message: 'token is required.' };
    }
    const data = await this.verificationService.verifyWidgetToken(user.id, body.token);
    return { success: true, data };
  }
}

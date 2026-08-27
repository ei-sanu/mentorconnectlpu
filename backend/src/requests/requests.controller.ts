import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

@ApiTags('Mentorship Requests')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post()
  @ApiOperation({ summary: 'Send a new mentorship request (Student)' })
  async create(@CurrentUser() user: any, @Body() dto: CreateRequestDto): Promise<any> {
    const request = await this.requestsService.create(user.id, dto);
    return { success: true, data: request };
  }

  @Get()
  @ApiOperation({ summary: 'Get all requests related to current user (Student or Mentor)' })
  async getAll(@CurrentUser() user: any): Promise<any> {
    const list = await this.requestsService.findAll(user.id, user.role);
    return { success: true, data: list };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of specific request' })
  async getOne(@Param('id') id: string, @CurrentUser() user: any): Promise<any> {
    const request = await this.requestsService.findOne(id, user.id);
    return { success: true, data: request };
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Accept mentorship request (Mentor)' })
  async accept(@Param('id') id: string, @CurrentUser() user: any): Promise<any> {
    const mentorship = await this.requestsService.accept(id, user.id);
    return { success: true, data: mentorship };
  }

  @Post(':id/decline')
  @ApiOperation({ summary: 'Decline mentorship request (Mentor)' })
  async decline(@Param('id') id: string, @CurrentUser() user: any): Promise<any> {
    const declined = await this.requestsService.decline(id, user.id);
    return { success: true, data: declined };
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel sent mentorship request (Student)' })
  async cancel(@Param('id') id: string, @CurrentUser() user: any): Promise<any> {
    const cancelled = await this.requestsService.cancel(id, user.id);
    return { success: true, data: cancelled };
  }
}

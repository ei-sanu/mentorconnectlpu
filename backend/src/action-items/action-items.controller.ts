import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ActionItemsService } from './action-items.service';
import { CreateActionItemDto } from './dto/create-action-item.dto';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Action Items')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller()
export class ActionItemsController {
  constructor(private readonly actionItemsService: ActionItemsService) {}

  @Get('mentorships/:id/action-items')
  @ApiOperation({ summary: 'Get action items for a mentorship relationship' })
  async getActionItems(@Param('id') mentorshipId: string, @CurrentUser() user: any): Promise<any> {
    const list = await this.actionItemsService.findActionItemsForMentorship(mentorshipId, user.id);
    return { success: true, data: list };
  }

  @Post('mentorships/:id/action-items')
  @ApiOperation({ summary: 'Create action item for a mentorship relationship' })
  async createActionItem(
    @Param('id') mentorshipId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateActionItemDto,
  ): Promise<any> {
    const item = await this.actionItemsService.createActionItem(mentorshipId, user.id, dto);
    return { success: true, data: item };
  }

  @Patch('action-items/:id')
  @ApiOperation({ summary: 'Update action item status or details' })
  async updateActionItem(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: any): Promise<any> {
    const updated = await this.actionItemsService.updateActionItem(id, user.id, dto);
    return { success: true, data: updated };
  }
}

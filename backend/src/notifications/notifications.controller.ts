import { Controller, Get, Post, Patch, Param, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all notifications for logged-in user' })
  async getNotifications(@CurrentUser() user: any): Promise<any> {
    const list = await this.notificationsService.findAll(user.id);
    return { success: true, data: list };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark specific notification as read' })
  async markRead(@Param('id') id: string, @CurrentUser() user: any): Promise<any> {
    const updated = await this.notificationsService.markAsRead(id, user.id);
    return { success: true, data: updated };
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async readAll(@CurrentUser() user: any): Promise<any> {
    await this.notificationsService.markAllAsRead(user.id);
    return { success: true, message: 'All notifications marked as read' };
  }
}

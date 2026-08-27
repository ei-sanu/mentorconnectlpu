import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Messaging')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('conversations')
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Get()
  @ApiOperation({ summary: "Get all private conversations for logged-in user" })
  async getConversations(@CurrentUser() user: any): Promise<any> {
    const list = await this.messagingService.getConversations(user.id);
    return { success: true, data: list };
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get messages of a conversation (paginated)' })
  async getMessages(
    @Param('id') conversationId: string,
    @CurrentUser() user: any,
    @Query('limit') limit?: number,
    @Query('before') before?: string,
  ): Promise<any> {
    const messages = await this.messagingService.getMessages(
      conversationId,
      user.id,
      limit ? parseInt(limit as any, 10) : 20,
      before,
    );
    return { success: true, data: messages };
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Send message via HTTP REST' })
  async sendMessage(
    @Param('id') conversationId: string,
    @CurrentUser() user: any,
    @Body('content') content: string,
  ): Promise<any> {
    const message = await this.messagingService.sendMessage(conversationId, user.id, content);
    return { success: true, data: message };
  }
}

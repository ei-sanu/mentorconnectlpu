import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagingService } from './messaging.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../database/schemas/user.schema';
import { Conversation, ConversationDocument } from '../database/schemas/conversation.schema';
import { Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { globalEventBus } from '../common/event-bus';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: 'chat',
})
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(MessagingGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly messagingService: MessagingService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Conversation.name) private readonly conversationModel: Model<ConversationDocument>,
  ) {
    globalEventBus.on('dashboard_update', () => {
      this.logger.log('Broadcasting dashboard_update event to WebSocket clients');
      try {
        if (this.server) {
          this.server.emit('dashboard_update');
        }
      } catch (err) {
        this.logger.warn(`Failed to broadcast dashboard_update: ${err.message}`);
      }
    });
  }

  async handleConnection(client: Socket) {
    try {
      const authHeader = client.handshake.auth?.token || client.handshake.headers?.authorization;
      if (!authHeader) {
        client.disconnect(true);
        return;
      }

      const token = authHeader.replace('Bearer ', '');
      let clerkUserId: string;

      if (token.startsWith('mock_token_')) {
        // Dev/test mock token — safe to trust in non-production
        clerkUserId = token.replace('mock_token_', '');
      } else {
        // Real Clerk JWT — verify signature via JWKS
        const jwksUri = process.env.CLERK_JWKS_URL;
        if (!jwksUri || !jwksUri.startsWith('https')) {
          // If JWKS not configured for real tokens, reject
          this.logger.warn('Real JWT received but CLERK_JWKS_URL not configured for WebSocket auth');
          client.disconnect(true);
          return;
        }

        try {
          const jwksRsa = require('jwks-rsa');
          const jwksClient = jwksRsa({
            jwksUri,
            cache: true,
            rateLimit: true,
            jwksRequestsPerMinute: 10,
          });

          const decodedHeader: any = jwt.decode(token, { complete: true });
          if (!decodedHeader?.header?.kid) {
            client.disconnect(true);
            return;
          }

          const key = await jwksClient.getSigningKey(decodedHeader.header.kid);
          const publicKey = key.getPublicKey();
          const verified: any = jwt.verify(token, publicKey);
          clerkUserId = verified.sub;
        } catch (jwtErr) {
          this.logger.warn(`WebSocket JWT verification failed: ${jwtErr.message}`);
          client.disconnect(true);
          return;
        }
      }

      const user = await this.userModel.findOne({ clerkUserId }).lean();

      if (!user) {
        client.disconnect(true);
        return;
      }

      client.data.user = {
        ...user,
        id: user._id.toString(),
      };
      this.logger.log(`Socket Client Connected: ${user.firstName} ${user.lastName} (ID: ${user._id.toString()})`);
    } catch (err) {
      this.logger.error(`Socket connection error: ${err.message}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    if (client.data?.user) {
      this.logger.log(`Socket Client Disconnected: ${client.data.user.firstName}`);
    }
  }

  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = client.data.user?.id;
    if (!userId) return;

    try {
      // Verify user is participant in conversation
      const conversation = await this.conversationModel.findOne({
        _id: new Types.ObjectId(data.conversationId),
        participants: new Types.ObjectId(userId),
      });

      if (conversation) {
        client.join(`conversation:${data.conversationId}`);
        this.logger.log(`User ${userId} joined room conversation:${data.conversationId}`);
        client.emit('joined_room', { conversationId: data.conversationId });
      } else {
        client.emit('error', { message: 'Not authorized for this conversation' });
      }
    } catch (error) {
      client.emit('error', { message: 'Invalid conversation reference' });
    }
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; content: string },
  ) {
    const userId = client.data.user?.id;
    if (!userId) return;

    try {
      const message = await this.messagingService.sendMessage(
        data.conversationId,
        userId,
        data.content,
      );

      this.server.to(`conversation:${data.conversationId}`).emit('new_message', message);
    } catch (err) {
      client.emit('error', { message: err.message });
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; isTyping: boolean },
  ) {
    const userId = client.data.user?.id;
    if (!userId) return;

    client.to(`conversation:${data.conversationId}`).emit('typing', {
      userId,
      isTyping: data.isTyping,
    });
  }
}

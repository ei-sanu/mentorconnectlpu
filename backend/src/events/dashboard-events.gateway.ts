import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, Role } from '../database/schemas/user.schema';
import { globalEventBus } from '../common/event-bus';
import { DashboardEventsService } from './dashboard-events.service';

interface DashboardEventPayload {
  type: string;
  scope?: string;
  targetRole?: string;
}

/** Which officer rooms care about which event types. */
const EVENT_ROOMS: Record<string, string[]> = {
  VERIFICATION_SUBMITTED: [Role.ALUMNI_OFFICER],
  VERIFICATION_APPROVED: [Role.ALUMNI_OFFICER],
  VERIFICATION_REJECTED: [Role.ALUMNI_OFFICER],
  VERIFICATION_CHANGES_REQUESTED: [Role.ALUMNI_OFFICER],
  MENTORSHIP_REQUEST_CREATED: [Role.PLACEMENT_OFFICER],
  MENTORSHIP_REQUEST_ACCEPTED: [Role.PLACEMENT_OFFICER],
  MENTORSHIP_REQUEST_DECLINED: [Role.PLACEMENT_OFFICER],
  MENTORSHIP_REQUEST_CANCELLED: [Role.PLACEMENT_OFFICER],
  SESSION_BOOKED: [Role.PLACEMENT_OFFICER],
};

/**
 * Real-time dashboard gateway.
 * - Authenticated via Clerk JWT (same scheme as the chat gateway).
 * - Each client joins a room for its role (`role:ADMIN`, `role:ALUMNI_OFFICER`, …);
 *   ADMINs additionally join officer rooms so they see every event.
 * - Subscribes to the existing in-process `globalEventBus` ('dashboard_update')
 *   that services already emit on data mutations, and forwards typed events
 *   to the relevant role rooms. Also busts dashboard aggregation caches.
 */
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: 'dashboard',
})
export class DashboardEventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(DashboardEventsGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly dashboardEventsService: DashboardEventsService,
  ) {
    // Reuse the existing event bus — services already emit here on mutations.
    globalEventBus.on('dashboard_update', (payload?: DashboardEventPayload) => {
      this.handleDashboardUpdate(payload);
    });
  }

  afterInit() {
    this.logger.log('Dashboard events gateway initialised');
  }

  private handleDashboardUpdate(payload?: DashboardEventPayload) {
    try {
      const type = payload?.type ?? 'DATA_CHANGED';
      const rooms = EVENT_ROOMS[type] ?? [Role.ALUMNI_OFFICER, Role.PLACEMENT_OFFICER];
      if (payload?.targetRole === 'MENTOR') {
        rooms.length = 0;
        rooms.push(Role.ALUMNI_OFFICER);
      } else if (payload?.targetRole === 'STUDENT') {
        rooms.length = 0;
        rooms.push(Role.PLACEMENT_OFFICER);
      }

      const event = { type, occurredAt: new Date().toISOString() };
      for (const room of rooms) {
        this.server?.to(`role:${room}`).emit('dashboard:update', event);
      }
      // ADMINs are members of all officer rooms, so they receive everything.

      // Keep cached aggregates correct — bust them so refetches recompute.
      this.dashboardEventsService.bustDashboardCaches();
    } catch (err: any) {
      this.logger.warn(`Failed to forward dashboard event: ${err.message}`);
    }
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
        clerkUserId = token.replace('mock_token_', '');
      } else {
        const jwksUri = process.env.CLERK_JWKS_URL;
        if (!jwksUri || !jwksUri.startsWith('https')) {
          this.logger.warn('Dashboard WS: real JWT received but CLERK_JWKS_URL not configured');
          client.disconnect(true);
          return;
        }
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
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
        } catch (jwtErr: any) {
          this.logger.warn(`Dashboard WS JWT verification failed: ${jwtErr.message}`);
          client.disconnect(true);
          return;
        }
      }

      const user = await this.userModel.findOne({ clerkUserId }).lean();
      if (!user) {
        client.disconnect(true);
        return;
      }

      client.data.user = { id: user._id.toString(), role: user.role };

      client.join(`role:${user.role}`);
      if (user.role === Role.ADMIN) {
        client.join(`role:${Role.ALUMNI_OFFICER}`);
        client.join(`role:${Role.PLACEMENT_OFFICER}`);
      }

      this.logger.log(`Dashboard socket connected: ${user.role} (${user._id.toString()})`);
    } catch (err: any) {
      this.logger.error(`Dashboard socket connection error: ${err.message}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    if (client.data?.user?.id) {
      this.logger.log(`Dashboard socket disconnected: ${client.data.user.id}`);
    }
  }
}

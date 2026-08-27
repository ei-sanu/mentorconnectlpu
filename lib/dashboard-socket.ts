'use client';

import { io, Socket } from 'socket.io-client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
const WS_URL = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

/**
 * Singleton Socket.IO client for the real-time dashboard namespace.
 * Authenticates with the Clerk session JWT (same scheme as the REST layer).
 * The server places each connection in a role-scoped room and pushes
 * `dashboard:update` events when relevant database data changes.
 */
class DashboardSocketManager {
  private socket: Socket | null = null;
  private connecting: Promise<Socket | null> | null = null;

  async getToken(maxMs = 3000): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    const poll = async (elapsed = 0): Promise<string | null> => {
      const clerk = (window as any).Clerk;
      if (clerk?.session) {
        try {
          const token = await clerk.session.getToken();
          if (token) return token;
        } catch {
          // fall through to retry
        }
      }
      if (elapsed >= maxMs) return null;
      await new Promise((r) => setTimeout(r, 150));
      return poll(elapsed + 150);
    };
    return poll();
  }

  async connect(): Promise<Socket | null> {
    if (typeof window === 'undefined') return null;
    if (this.socket?.connected) return this.socket;
    if (this.connecting) return this.connecting;

    this.connecting = (async () => {
      const token = await this.getToken();
      if (!token) return null;

      const socket = io(`${WS_URL}/dashboard`, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      });

      socket.on('connect_error', () => {
        // Silent — dashboards still work via manual refresh / polling.
      });

      this.socket = socket;
      return socket;
    })();

    try {
      return await this.connecting;
    } finally {
      this.connecting = null;
    }
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
}

export const dashboardSocket = new DashboardSocketManager();

/**
 * Subscribe to dashboard update events. Returns an unsubscribe function.
 * Multiple listeners share one underlying connection.
 */
export function onDashboardUpdate(handler: (event: { type: string; occurredAt: string }) => void) {
  let active = true;
  let socketRef: Socket | null = null;

  dashboardSocket.connect().then((socket) => {
    if (!socket || !active) return;
    socketRef = socket;
    socket.on('dashboard:update', handler);
  });

  return () => {
    active = false;
    if (socketRef) {
      socketRef.off('dashboard:update', handler);
    }
  };
}

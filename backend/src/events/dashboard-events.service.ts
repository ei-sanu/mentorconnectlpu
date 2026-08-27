import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';

/**
 * Shared helper for the real-time dashboard pipeline.
 * Holds cache-busting logic for dashboard aggregation caches in Redis.
 */
@Injectable()
export class DashboardEventsService {
  private readonly logger = new Logger(DashboardEventsService.name);
  private redis: Redis | null = null;

  private getRedis(): Redis | null {
    if (this.redis) return this.redis;
    try {
      const redisOptions: any = {};
      if (process.env.REDIS_URL && process.env.REDIS_URL.startsWith('rediss://')) {
        redisOptions.tls = { rejectUnauthorized: false };
      }
      this.redis = process.env.REDIS_URL
        ? new Redis(process.env.REDIS_URL, { lazyConnect: true, ...redisOptions })
        : new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379', 10),
            lazyConnect: true,
            ...redisOptions,
          });
    } catch {
      this.redis = null;
    }
    return this.redis;
  }

  /** Delete dashboard aggregation cache keys so next fetches recompute fresh data. */
  bustDashboardCaches(keys: string[] = ['dash:admin:v2', 'dash:alumni:v1', 'dash:placement:v1']) {
    const redis = this.getRedis();
    if (redis) {
      redis.del(...keys).catch(() => undefined);
    }
  }
}

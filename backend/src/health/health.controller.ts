import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import Redis from 'ioredis';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health Check')
@Controller('health')
export class HealthController {
  constructor(
    @InjectConnection() private readonly connection: Connection,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Perform structural system health checks' })
  async getHealth() {
    let databaseStatus = 'healthy';
    let redisStatus = 'healthy';

    // 1. Verify MongoDB Connection
    try {
      if (this.connection.readyState !== 1) {
        throw new Error(`MongoDB connection readyState is ${this.connection.readyState}`);
      }
    } catch (err) {
      databaseStatus = `unhealthy: ${err.message}`;
    }

    let redis: Redis | null = null;
    try {
      const redisOptions: any = {};
      if (process.env.REDIS_URL && process.env.REDIS_URL.startsWith('rediss://')) {
        redisOptions.tls = { rejectUnauthorized: false };
      }
      redis = process.env.REDIS_URL
        ? new Redis(process.env.REDIS_URL, { lazyConnect: true, ...redisOptions })
        : new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379', 10),
            lazyConnect: true,
          });
      await redis.connect();
      const ping = await redis.ping();
      if (ping !== 'PONG') {
        redisStatus = 'unhealthy: ping response is not PONG';
      }
      await redis.quit();
    } catch (err) {
      redisStatus = `unhealthy: ${err.message}`;
    } finally {
      if (redis) {
        try {
          redis.disconnect();
        } catch {}
      }
    }

    const overallHealthy = databaseStatus === 'healthy' && redisStatus === 'healthy';

    return {
      status: overallHealthy ? 'healthy' : 'unhealthy',
      database: databaseStatus,
      redis: redisStatus,
      application: 'healthy',
      timestamp: new Date().toISOString(),
    };
  }
}

"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const ioredis_1 = require("ioredis");
const swagger_1 = require("@nestjs/swagger");
let HealthController = class HealthController {
    constructor(connection) {
        this.connection = connection;
    }
    async getHealth() {
        let databaseStatus = 'healthy';
        let redisStatus = 'healthy';
        try {
            if (this.connection.readyState !== 1) {
                throw new Error(`MongoDB connection readyState is ${this.connection.readyState}`);
            }
        }
        catch (err) {
            databaseStatus = `unhealthy: ${err.message}`;
        }
        let redis = null;
        try {
            const redisOptions = {};
            if (process.env.REDIS_URL && process.env.REDIS_URL.startsWith('rediss://')) {
                redisOptions.tls = { rejectUnauthorized: false };
            }
            redis = process.env.REDIS_URL
                ? new ioredis_1.default(process.env.REDIS_URL, { lazyConnect: true, ...redisOptions })
                : new ioredis_1.default({
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
        }
        catch (err) {
            redisStatus = `unhealthy: ${err.message}`;
        }
        finally {
            if (redis) {
                try {
                    redis.disconnect();
                }
                catch { }
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
};
exports.HealthController = HealthController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Perform structural system health checks' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "getHealth", null);
exports.HealthController = HealthController = __decorate([
    (0, swagger_1.ApiTags)('Health Check'),
    (0, common_1.Controller)('health'),
    __param(0, (0, mongoose_1.InjectConnection)()),
    __metadata("design:paramtypes", [mongoose_2.Connection])
], HealthController);
//# sourceMappingURL=health.controller.js.map
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var DashboardEventsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardEventsService = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = require("ioredis");
let DashboardEventsService = DashboardEventsService_1 = class DashboardEventsService {
    constructor() {
        this.logger = new common_1.Logger(DashboardEventsService_1.name);
        this.redis = null;
    }
    getRedis() {
        if (this.redis)
            return this.redis;
        try {
            const redisOptions = {};
            if (process.env.REDIS_URL && process.env.REDIS_URL.startsWith('rediss://')) {
                redisOptions.tls = { rejectUnauthorized: false };
            }
            this.redis = process.env.REDIS_URL
                ? new ioredis_1.default(process.env.REDIS_URL, { lazyConnect: true, ...redisOptions })
                : new ioredis_1.default({
                    host: process.env.REDIS_HOST || 'localhost',
                    port: parseInt(process.env.REDIS_PORT || '6379', 10),
                    lazyConnect: true,
                    ...redisOptions,
                });
        }
        catch {
            this.redis = null;
        }
        return this.redis;
    }
    bustDashboardCaches(keys = ['dash:admin:v2', 'dash:alumni:v1', 'dash:placement:v1']) {
        const redis = this.getRedis();
        if (redis) {
            redis.del(...keys).catch(() => undefined);
        }
    }
};
exports.DashboardEventsService = DashboardEventsService;
exports.DashboardEventsService = DashboardEventsService = DashboardEventsService_1 = __decorate([
    (0, common_1.Injectable)()
], DashboardEventsService);
//# sourceMappingURL=dashboard-events.service.js.map
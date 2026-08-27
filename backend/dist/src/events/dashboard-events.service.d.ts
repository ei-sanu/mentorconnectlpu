export declare class DashboardEventsService {
    private readonly logger;
    private redis;
    private getRedis;
    bustDashboardCaches(keys?: string[]): void;
}

import { Connection } from 'mongoose';
export declare class HealthController {
    private readonly connection;
    constructor(connection: Connection);
    getHealth(): Promise<{
        status: string;
        database: string;
        redis: string;
        application: string;
        timestamp: string;
    }>;
}

import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Model } from 'mongoose';
import { UserDocument } from '../database/schemas/user.schema';
import { DashboardEventsService } from './dashboard-events.service';
export declare class DashboardEventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private readonly userModel;
    private readonly dashboardEventsService;
    private readonly logger;
    server: Server;
    constructor(userModel: Model<UserDocument>, dashboardEventsService: DashboardEventsService);
    afterInit(): void;
    private handleDashboardUpdate;
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
}

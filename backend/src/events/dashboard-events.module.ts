import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../database/schemas/user.schema';
import { DashboardEventsGateway } from './dashboard-events.gateway';
import { DashboardEventsService } from './dashboard-events.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
  providers: [DashboardEventsGateway, DashboardEventsService],
  exports: [DashboardEventsService],
})
export class DashboardEventsModule {}

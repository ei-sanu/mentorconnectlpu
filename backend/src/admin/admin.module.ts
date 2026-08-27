import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [AuthModule, AuditModule, AnalyticsModule],
  controllers: [AdminController],
})
export class AdminModule {}

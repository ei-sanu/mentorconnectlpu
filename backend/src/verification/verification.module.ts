import { Module } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { VerificationController } from './verification.controller';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { Msg91Module } from '../integrations/msg91/msg91.module';
import { DashboardEventsModule } from '../events/dashboard-events.module';

@Module({
  imports: [AuthModule, AuditModule, NotificationsModule, Msg91Module, DashboardEventsModule],
  controllers: [VerificationController],
  providers: [VerificationService],
  exports: [VerificationService],
})
export class VerificationModule {}

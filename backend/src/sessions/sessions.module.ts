import { Module, forwardRef } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CalendarModule } from '../calendar/calendar.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    AuthModule,
    NotificationsModule,
    forwardRef(() => CalendarModule),
    AuditModule,
  ],
  controllers: [SessionsController],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}

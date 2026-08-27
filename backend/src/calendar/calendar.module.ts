import { Module, forwardRef } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { CalendarController } from './calendar.controller';
import { AuthModule } from '../auth/auth.module';
import { SessionsModule } from '../sessions/sessions.module';

@Module({
  imports: [AuthModule, forwardRef(() => SessionsModule)],
  controllers: [CalendarController],
  providers: [CalendarService],
  exports: [CalendarService],
})
export class CalendarModule {}

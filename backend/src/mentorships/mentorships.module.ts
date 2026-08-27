import { Module } from '@nestjs/common';
import { MentorshipsService } from './mentorships.service';
import { MentorshipsController } from './mentorships.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [MentorshipsController],
  providers: [MentorshipsService],
  exports: [MentorshipsService],
})
export class MentorshipsModule {}

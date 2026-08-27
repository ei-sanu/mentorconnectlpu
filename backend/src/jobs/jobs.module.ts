import { Module, forwardRef } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { MatchingModule } from '../matching/matching.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    forwardRef(() => MatchingModule),
    forwardRef(() => EmailModule),
  ],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}

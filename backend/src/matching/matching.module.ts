import { Module, forwardRef } from '@nestjs/common';
import { MatchingService } from './matching.service';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [forwardRef(() => JobsModule)],
  providers: [MatchingService],
  exports: [MatchingService],
})
export class MatchingModule {}

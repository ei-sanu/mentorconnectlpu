import { Module } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { RecommendationsController } from './recommendations.controller';
import { MatchingModule } from '../matching/matching.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [MatchingModule, AuthModule],
  controllers: [RecommendationsController],
  providers: [RecommendationsService],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}

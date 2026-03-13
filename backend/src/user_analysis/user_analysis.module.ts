import { Module } from '@nestjs/common';
import { UserAnalysisController } from './user_analysis.controller';
import { UserAnalysisService } from './user_analysis.service';
import { RedisModule } from 'src/redis/redis.module';
import { DrizzleModule } from 'src/drizzle/drizzle.module';

@Module({
  imports: [RedisModule, DrizzleModule],
  controllers: [UserAnalysisController],
  providers: [UserAnalysisService],
  exports: [UserAnalysisService],
})
export class UserAnalysisModule {}

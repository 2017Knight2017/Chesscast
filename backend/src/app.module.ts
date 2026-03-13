import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MatchesModule } from './matches/matches.module';
import { DrizzleModule } from './drizzle/drizzle.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { PlayersModule } from './players/players.module';
import { ScheduleModule } from '@nestjs/schedule';
import { UserAnalysisModule } from './user_analysis/user_analysis.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST,
        port: 6379,
      },
    }),
    MatchesModule,
    DrizzleModule,
    AuthModule,
    PlayersModule,
    ScheduleModule.forRoot(),
    UserAnalysisModule,
  ],
})
export class AppModule {}

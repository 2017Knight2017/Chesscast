import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MatchesModule } from './matches/matches.module';
import { DrizzleModule } from './drizzle/drizzle.module';
import { ConfigModule } from '@nestjs/config';

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
		DrizzleModule
	],
})
export class AppModule {}
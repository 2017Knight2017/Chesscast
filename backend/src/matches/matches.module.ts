import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import { MatchesProcessor } from './matches.processor';
import { MatchesGateway } from './matches.gateway';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { PlayersModule } from 'src/players/players.module';

@Module({
	imports: [
		DrizzleModule,
		PlayersModule,
		BullModule.registerQueue({
			name: 'analysis',
			defaultJobOptions: {
    			removeOnComplete: true, 
    			removeOnFail: false,
			}},
			{
			name: 'timer',
			defaultJobOptions: {
    			removeOnComplete: true, 
    			removeOnFail: false,
			}}
		),
	],
	controllers: [
		MatchesController
	],
	providers: [
		MatchesService, 
		MatchesProcessor,
		MatchesGateway
	],
	exports: [MatchesService],
})
export class MatchesModule {}
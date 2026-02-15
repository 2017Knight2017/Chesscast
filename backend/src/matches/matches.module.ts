import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import { MatchesProcessor } from './matches.processor';
import { DrizzleModule } from 'src/drizzle/drizzle.module';

@Module({
	imports: [
		DrizzleModule,
		BullModule.registerQueue({
			name: 'matches',
		}),
	],
	controllers: [
		MatchesController
	],
	providers: [
		MatchesService, 
		//MatchesProcessor,
	],
	exports: [MatchesService],
})
export class MatchesModule {}
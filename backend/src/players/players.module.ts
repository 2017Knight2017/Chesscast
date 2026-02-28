import { Module } from '@nestjs/common';
import { PlayersController } from './players.controller';
import { PlayersService } from './players.service';
import { DrizzleModule } from 'src/drizzle/drizzle.module';

@Module({
	imports: [DrizzleModule],
	controllers: [
		PlayersController
	],
	providers: [
		PlayersService, 
	],
	exports: [PlayersService]
})
export class PlayersModule {}
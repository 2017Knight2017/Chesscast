import { Controller, Get, Query, Logger } from '@nestjs/common';
import { PlayersService } from './players.service';

@Controller('players')
export class PlayersController {
	constructor(private readonly playersService: PlayersService) {
		this.logger.log('constructor called');
	}

	private readonly logger = new Logger(PlayersController.name);

	@Get('search')
	async searchPlayers(@Query('name') name: string) {
		this.logger.log('searchPlayers called');
		if (!name || name.length < 2) return [];
		return this.playersService.findByName(name);
	}
}

import { Controller, Get, Query, Param } from '@nestjs/common';
import { PlayersService } from './players.service';

@Controller('players')
export class PlayersController {
	constructor(private readonly playersService: PlayersService) {
		console.log('[PlayersController] constructor called');
	}

	@Get('search')
	async searchPlayers(@Query('name') name: string) {
		console.log('[PlayersController] searchPlayers called');
    	if (!name || name.length < 2) return [];
		return this.playersService.findByName(name);
	}
}

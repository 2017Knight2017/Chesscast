import { Controller, Post, Param, HttpCode, HttpStatus, Body } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { log } from 'console';

@Controller('matches')
export class MatchesController {
	constructor(private readonly matchesService: MatchesService) {}

	@Post()
	@HttpCode(HttpStatus.CREATED) 
	async createBroadcast(
		@Body('author') author: string,
		@Body('pgn') pgn: string,
		@Body('archetypes') archetypes: [string, string]
	) {
		return await this.matchesService.createBroadcast(author, pgn, archetypes);
	}
	
	@Post(':id/report')
	async handleWorkerReport(
		@Param('id') id: string,
		@Body() data: { evaluations: number[], durations: number[] }
	) {
		return await this.matchesService.handleWorkerReport(id, data['evaluations'], data['durations'])
		

		// Опционально: уведомляем фронтенд через WebSockets, что данные готовы
		//this.eventsGateway.notifyMatchReady(id); 
	}
}
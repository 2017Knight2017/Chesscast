import { Controller, Post, Get, Param, HttpCode, HttpStatus, Body, Inject, NotFoundException } from '@nestjs/common';
import { MatchesService } from './matches.service';

@Controller('matches')
export class MatchesController {
	constructor(
		private readonly matchesService: MatchesService,
	) {}

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
		@Body() data: { evaluations: number[], durations: number[], notation: string[] }
	) {
		return await this.matchesService.handleWorkerReport(id, data['evaluations'], data['durations'], data['notation'])
	}

	@Post(':id/start')
	async startBroadcast(
		@Param('id') id: string
	) {
		return await this.matchesService.startBroadcast(id);
	}

	@Get(':id/state')
	async checkGameState(
		@Param('id') id: string
	) {
		return await this.matchesService.checkGameState(id);
	}
		// Опционально: уведомляем фронтенд через WebSockets, что данные готовы
		//this.eventsGateway.notifyMatchReady(id); 
}
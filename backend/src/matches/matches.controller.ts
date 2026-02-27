import { Controller, Post, Get, Param, HttpCode, HttpStatus, Body, Inject, NotFoundException, UseGuards, Request } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

interface userRequest extends Request {
	user: {
		id: number;
		username: string;
	}
}

@Controller('matches')
export class MatchesController {
	constructor(
		private readonly matchesService: MatchesService,
	) {}

	@Post('create')
	@UseGuards(JwtAuthGuard)
	@HttpCode(HttpStatus.CREATED) 
	async createBroadcast(@Request() req: userRequest, @Body() body: {
		pgn: string,
		archetypes: [string, string],
		whitePlayer: string,
		blackPlayer: string,
		title: string,
		scheduledAt: string,
		timeControl: number
	}){
		return this.matchesService.createBroadcast(req.user.id, req.user.username, body.title, new Date(body.scheduledAt), body.pgn, body.whitePlayer, body.blackPlayer, body.archetypes, body.timeControl);
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

	@Get('followed')
	@UseGuards(JwtAuthGuard)
	async getFollowed(@Request() req) {
		return this.matchesService.checkFollowedMatches(req.user.id);
	}
	
	@Get('planned')
	@UseGuards(JwtAuthGuard)
	async getPlanned(@Request() req) {
		return this.matchesService.checkPlannedMatches(req.user.id);
	}

	@Get('live')
	async getLiveMatches() {
		return this.matchesService.getMatchesByStatus('in_progress');
}
}
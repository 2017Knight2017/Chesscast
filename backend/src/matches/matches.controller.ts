import { Controller, Post, Get, Param, HttpCode, HttpStatus, Body, Inject, NotFoundException, UseGuards, Request } from '@nestjs/common';
import { MatchesService, Match } from './matches.service';
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

	@Get('my_followed')
	@UseGuards(JwtAuthGuard)
	async getMyFollowed(@Request() req) {
		return this.matchesService.checkMyFollowedMatches(req.user.id);
	}
	
	@Get('my_planned')
	@UseGuards(JwtAuthGuard)
	async getMyPlanned(@Request() req) {
		return this.matchesService.checkMyPlannedMatches(req.user.id);
	}

	@Get('planned')
	async getPlanned(@Request() req): Promise<Match[]> {
		return this.matchesService.getMatchesByStatus('waiting');
	}

	@Get('live')
	async getLiveMatches(): Promise<Match[]> {
		return this.matchesService.getMatchesByStatus('in_progress');
	}
}
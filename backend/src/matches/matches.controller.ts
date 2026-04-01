import { Controller, Post, Get, Param, HttpCode, HttpStatus, Body, Inject, NotFoundException, UseGuards, Request, Logger } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { Match } from './matches.types';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import * as sc from '../schema';
import { LifecycleService } from './lifecycle.service';

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
		private readonly lifecycleService: LifecycleService,
		@Inject(DrizzleAsyncProvider) private db: NodePgDatabase<typeof sc>,
	) {
		this.logger.log('constructor called');
	}

	private readonly logger = new Logger(MatchesController.name);

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
		timeControl: number,
		timeIncrement: number,
		controlMove?: number,
		bonusTimeMin?: number,
		nextControlMoveAfter?: number,
		newTimeIncrement?: number
	}){
		this.logger.log('createBroadcast called');
		if (body.nextControlMoveAfter) {
			return this.matchesService.createBroadcast(
				req.user.id, 
				req.user.username, 
				body.title, 
				new Date(body.scheduledAt), 
				body.pgn, 
				body.whitePlayer, 
				body.blackPlayer, 
				body.archetypes, 
				body.timeControl,
				body.controlMove!,
				body.timeIncrement,
				body.bonusTimeMin!,
				body.nextControlMoveAfter,
				body.newTimeIncrement!
			);
		} else if (body.controlMove && body.bonusTimeMin && body.newTimeIncrement) {
			return this.matchesService.createBroadcast(
				req.user.id, 
				req.user.username, 
				body.title, 
				new Date(body.scheduledAt), 
				body.pgn, 
				body.whitePlayer, 
				body.blackPlayer, 
				body.archetypes, 
				body.timeControl,
				body.controlMove,
				body.timeIncrement,
				body.bonusTimeMin,
				body.newTimeIncrement
			);
		} else {
			return this.matchesService.createBroadcast(
				req.user.id, 
				req.user.username, 
				body.title, 
				new Date(body.scheduledAt), 
				body.pgn, 
				body.whitePlayer, 
				body.blackPlayer, 
				body.archetypes, 
				body.timeControl,
				body.timeIncrement
			);
		}
		
	}
	
	@Post(':id/report')
	async handleWorkerReport(
		@Param('id') id: string,
		@Body() data: { evaluations: number[], timeRemaining: number[], notation: string[], outcome: '1/2-1/2'|'1-0'|'0-1' }
	) {
		this.logger.log('handleWorkerReport called');
		return await this.lifecycleService.handleWorkerReport(id, data['evaluations'], data['timeRemaining'], data['notation'], data['outcome'])
	}

	@Post(':id/start')
	async startBroadcast(
		@Param('id') id: string
	) {
		this.logger.log('startBroadcast called');
		return await this.lifecycleService.startBroadcast(id);
	}

	@Get(':id/state')
	async checkGameState(
		@Param('id') id: string
	) {
		this.logger.log('checkGameState called');
		return await this.matchesService.checkGameState(id);
	}

	@Get('my_followed')
	@UseGuards(JwtAuthGuard)
	async getMyFollowed(@Request() req) {
		this.logger.log('getMyFollowed called');
		return this.matchesService.getMatchesByTable({
			table: sc.followedBroadcasts,
			isJoinTable: true, 
			userId: req.user.id
		});
	}
	
	@Get('my_planned')
	@UseGuards(JwtAuthGuard)
	async getMyPlanned(@Request() req) {
		this.logger.log('getMyPlanned called');
		return this.matchesService.getMatchesByTable({
			table: sc.plannedBroadcasts,
			isJoinTable: true, 
			userId: req.user.id
		});
	}

	@Get('planned')
	async getPlanned(@Request() req): Promise<Match[]> {
		this.logger.log('getPlanned called');
		return this.matchesService.getMatchesByTable({
			table: sc.followedBroadcasts,
			isJoinTable: false, 
			status: 'waiting'
		});
	}

	@Get('live')
	async getLiveMatches(): Promise<Match[]> {
		this.logger.log('getLiveMatches called');
		return this.matchesService.getMatchesByTable({
			table: sc.followedBroadcasts,
			isJoinTable: false, 
			status: 'in_progress'
		});
	}
}
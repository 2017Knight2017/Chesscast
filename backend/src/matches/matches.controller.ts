import {
	Controller,
	Post,
	Get,
	Param,
	Query,
	HttpCode,
	HttpStatus,
	Body,
	Inject,
	UseGuards,
	Request,
	Logger,
	Delete,
} from '@nestjs/common';
import { MatchesService } from './matches.service';
import { FollowService } from './follow.service';
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
	};
}

@Controller('matches')
export class MatchesController {
	constructor(
		private readonly matchesService: MatchesService,
		private readonly lifecycleService: LifecycleService,
		private readonly followService: FollowService,
		@Inject(DrizzleAsyncProvider) private db: NodePgDatabase<typeof sc>,
	) {
		this.logger.log('constructor called');
	}

	private readonly logger = new Logger(MatchesController.name);

	@Post('create')
	@UseGuards(JwtAuthGuard)
	@HttpCode(HttpStatus.CREATED)
	async createBroadcast(
		@Request() req: userRequest,
		@Body()
		body: {
			pgn: string;
			archetypes: [string, string];
			whitePlayer: string;
			blackPlayer: string;
			title: string;
			scheduledAt: string;
			timeControl: number;
			timeIncrement: number;
			controlMove?: number;
			bonusTimeMin?: number;
			nextControlMoveAfter?: number;
			newTimeIncrement?: number;
		},
	) {
		this.logger.log('createBroadcast called', JSON.stringify(body));
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
				body.timeIncrement,
				body.controlMove!,
				body.bonusTimeMin,
				body.nextControlMoveAfter,
				body.newTimeIncrement,
			);
		} else if (
			body.controlMove &&
			body.bonusTimeMin &&
			body.newTimeIncrement
		) {
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
				body.timeIncrement,
				body.controlMove,
				body.bonusTimeMin,
				0,
				body.newTimeIncrement,
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
				body.timeIncrement,
			);
		}
	}

	@Post(':id/report')
	async handleWorkerReport(
		@Param('id') id: string,
		@Body()
		data: {
			evaluations: number[];
			timeRemaining: number[];
			notation: string[];
			outcome: '1/2-1/2' | '1-0' | '0-1';
		},
	) {
		this.logger.log('handleWorkerReport called');
		return await this.lifecycleService.handleWorkerReport(
			id,
			data['evaluations'],
			data['timeRemaining'],
			data['notation'],
			data['outcome'],
		);
	}

	@Post(':id/start')
	async startBroadcast(@Param('id') id: string) {
		this.logger.log('startBroadcast called');
		return await this.lifecycleService.startBroadcast(id);
	}

	@Get(':id/state')
	async checkGameState(@Param('id') id: string) {
		this.logger.log('checkGameState called');
		return await this.matchesService.checkGameState(id);
	}

	@Get(':username/all')
	async getUserAllMatches(
		@Param('username') username: string,
		@Query('category') category: 'live' | 'planned' | 'finished',
		@Query('page') page?: string,
		@Query('limit') limit?: string,
	) {
		this.logger.log('getUserAllMatches called');

		if (!category || !['live', 'planned', 'finished'].includes(category)) {
			throw new Error('Invalid category. Must be one of: live, planned, finished');
		}

		const pageNum = page ? parseInt(page, 10) : 1;
		const limitNum = limit ? parseInt(limit, 10) : 25;

		const result = await this.matchesService.getUserMatchesAll({
			username,
			category,
			page: pageNum,
			limit: limitNum,
		});

		return result;
	}

	@Delete(':id')
	@UseGuards(JwtAuthGuard)
	@HttpCode(HttpStatus.NO_CONTENT)
	async deleteMatch(@Request() req: userRequest, @Param('id') id: string) {
		this.logger.log(`deleteMatch called: userId=${req.user.id}, matchId=${id}`);
		await this.matchesService.deleteMatch(id, req.user.username);
	}

	@Post(':id/follow')
	@UseGuards(JwtAuthGuard)
	@HttpCode(HttpStatus.CREATED)
	async followMatch(@Request() req: userRequest, @Param('id') id: string) {
		this.logger.log(
			`followMatch called: userId=${req.user.id}, matchId=${id}`,
		);
		return this.followService.followMatch(req.user.id, id);
	}

	@Delete(':id/follow')
	@UseGuards(JwtAuthGuard)
	@HttpCode(HttpStatus.NO_CONTENT)
	async unfollowMatch(@Request() req: userRequest, @Param('id') id: string) {
		this.logger.log(
			`unfollowMatch called: userId=${req.user.id}, matchId=${id}`,
		);
		return this.followService.unfollowMatch(req.user.id, id);
	}

	@Get(':id/follow/status')
	@UseGuards(JwtAuthGuard)
	async getFollowStatus(
		@Request() req: userRequest,
		@Param('id') id: string,
	) {
		const isFollowing = await this.followService.isFollowing(
			req.user.id,
			id,
		);
		return { isFollowing };
	}

	@Get('planned')
	async getPlanned(
		@Query('page') page?: string,
		@Query('limit') limit?: string,
	) {
		this.logger.log('getPlanned called');
		const pageNum = page ? parseInt(page, 10) : 1;
		const limitNum = limit ? parseInt(limit, 10) : 25;

		const result = await this.matchesService.getMatches({
			status: 'waiting',
			page: pageNum,
			limit: limitNum,
		});

		return result;
	}

	@Get('live')
	async getLiveMatches(
		@Query('page') page?: string,
		@Query('limit') limit?: string,
	) {
		this.logger.log('getLiveMatches called');
		const pageNum = page ? parseInt(page, 10) : 1;
		const limitNum = limit ? parseInt(limit, 10) : 25;

		const result = await this.matchesService.getMatches({
			status: 'in_progress',
			page: pageNum,
			limit: limitNum,
		});

		return result;
	}
}

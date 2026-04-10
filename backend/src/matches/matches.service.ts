import { Injectable, Inject, Logger } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, desc } from 'drizzle-orm';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { PgTableWithColumns } from 'drizzle-orm/pg-core';
import * as sc from '../schema';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import { RedisService } from 'src/redis/redis.service';
import { EngineService } from './engine.service';
import { ArchetypeService } from './archetype.service';
import { Match } from './matches.types';
import { formatTime } from './utils/format-time';

@Injectable()
export class MatchesService {
	private readonly logger = new Logger(MatchesService.name);

	constructor(
		@Inject(DrizzleAsyncProvider) private db: NodePgDatabase<typeof sc>,
		@InjectQueue('analysis') private analysisQueue: Queue,
		@Inject(RedisService) private redisService: RedisService,
		private archetypeService: ArchetypeService,
	) {}

	async createBroadcast(
		authorId: number,
		author: string,
		title: string,
		scheduledAt: Date,
		pgn: string,
		whitePlayer: string,
		blackPlayer: string,
		archetypes: [string, string],
		timeControl: number,
		timeIncrement: number,
		controlMove: number = 0,
		bonusTimeMin: number = 0,
		nextControlMoveAfter: number = 0,
		newTimeIncrement: number = 0,
	) {
		
		this.logger.log('createBroadcast called', JSON.stringify({
			authorId,
			author,
			title,
			scheduledAt,
			pgn,
			whitePlayer,
			blackPlayer,
			archetypes,
			timeControl,
			timeIncrement,
			controlMove,
			bonusTimeMin,
			nextControlMoveAfter,
			newTimeIncrement,
		}));

		const validatedArchetypes = await this.archetypeService.validate(
			whitePlayer,
			blackPlayer,
			archetypes,
		);

		const [analysis] = await this.db
			.insert(sc.analysis)
			.values({
				pgn,
				timeControl,
				controlMove,
				increment: timeIncrement,
				bonusTimeMin,
				newControlMoveEvery: nextControlMoveAfter,
				newIncrement: newTimeIncrement,
			})
			.returning();

		await this.db.insert(sc.matches).values({
			id: analysis.id,
			author,
			title,
			whitePlayer,
			blackPlayer,
			whitePlayerTime: timeControl * 1000,
			blackPlayerTime: timeControl * 1000,
			status: 'processing',
			moveIndex: 0,
			scheduledAt,
		});

		await this.db
			.insert(sc.plannedBroadcasts)
			.values({ userId: authorId, matchId: analysis.id });

		await this.analysisQueue.add(
			'analyze',
			{
				id: analysis.id,
				pgn,
				time_control: timeControl,
				control_move: controlMove,
				time_increment: timeIncrement,
				bonus_time_min: bonusTimeMin,
				next_control_move_after: nextControlMoveAfter,
				new_time_increment: newTimeIncrement,
				archetypes: validatedArchetypes,
			},
			{ attempts: 3, backoff: 5000 },
		);

		return analysis;
	}

	async checkGameState(id: string): Promise<Match | null> {
		this.logger.log('checkGameState called');

		const match = await this.db.query.matches.findFirst({
			where: eq(sc.matches.id, id),
		});
		const analysis = await this.db.query.analysis.findFirst({
			where: eq(sc.analysis.id, id),
		});

		if (!match || !analysis) return null;

		const viewerData = await this.redisService.getViewerData(id);
		const viewers = viewerData.count + viewerData.guestCount || 0;

		this.logger.log(analysis.timesRemaining);

		return {
			id: match.id,
			title: match.title,
			author: match.author,
			timeControl: analysis.timeControl,
			status: match.status,
			evaluations: analysis.evaluations.slice(0, match.moveIndex) || null,
			white: {
				name: match.whitePlayer,
				time: formatTime(Math.floor(match.whitePlayerTime / 1000)),
				timeMs: match.whitePlayerTime,
			},
			black: {
				name: match.blackPlayer,
				time: formatTime(Math.floor(match.blackPlayerTime / 1000)),
				timeMs: match.blackPlayerTime,
			},
			fen: match.fen || '',
			viewerCount: viewers,
			history: analysis.notation.slice(0, match.moveIndex) || [],
			outcome: analysis.outcome || undefined,
			newestMoveAt: match.newestMoveAt?.getTime(),
			timesRemaining:
				analysis.timesRemaining.slice(0, match.moveIndex) || null,
		};
	}

	async getMatchesByTable({
		table,
		isJoinTable,
		username,
		status,
	}: {
		table: PgTableWithColumns<any>;
		isJoinTable: boolean;
		username?: string;
		status?: Match['status'];
	}): Promise<Match[]> {
		this.logger.log('getMatchesByTable called');

		const query = this.db
			.select({
				id: sc.matches.id,
				author: sc.users.username,
				title: sc.matches.title,
				status: sc.matches.status,
				whitePlayer: sc.matches.whitePlayer,
				blackPlayer: sc.matches.blackPlayer,
				whitePlayerTime: sc.matches.whitePlayerTime,
				blackPlayerTime: sc.matches.blackPlayerTime,
				timeControl: sc.analysis.timeControl,
				fen: sc.matches.fen,
				newestMoveAt: sc.matches.newestMoveAt,
			})
			.from(sc.matches)
			.innerJoin(sc.users, eq(sc.matches.author, sc.users.username))
			.innerJoin(sc.analysis, eq(sc.analysis.id, sc.matches.id));

		if (isJoinTable && username) {
			const user = await this.db.query.users.findFirst({
			    where: eq(sc.users.username, username),
			    columns: { id: true }
			});

			if (!user) {
			    throw new Error('User not found');
			}
			
			query
				.innerJoin(table, eq(sc.matches.id, table.matchId as string))
				.where(eq(table.userId, user.id));
		} else if (status) {
			query.where(eq(sc.matches.status, status));
		}

		const raw = await query.orderBy(desc(sc.matches.createdAt)).limit(10);
		const viewerCounts = await Promise.all(
			raw.map((match) => this.redisService.getViewerData(match.id)),
		);

		return raw.map((match, index) => ({
			id: match.id,
			title: match.title,
			author: match.author,
			timeControl: match.timeControl,
			status: match.status,
			white: {
				name: match.whitePlayer,
				time: formatTime(match.whitePlayerTime),
				timeMs: match.whitePlayerTime,
			},
			black: {
				name: match.blackPlayer,
				time: formatTime(match.blackPlayerTime),
				timeMs: match.blackPlayerTime,
			},
			fen: match.fen || '',
			viewerCount:
				viewerCounts[index].count + viewerCounts[index].guestCount || 0,
			newestMoveAt: match.newestMoveAt?.getTime(),
		}));
	}
}

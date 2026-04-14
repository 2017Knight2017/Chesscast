import { Injectable, Inject, Logger, BadRequestException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, desc, and, ne, count } from 'drizzle-orm';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { PgTableWithColumns } from 'drizzle-orm/pg-core';
import * as sc from '../schema';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import { RedisService } from 'src/redis/redis.service';
import { ArchetypeService } from './archetype.service';
import { Match, MAX_ACTIVE_MATCHES_PER_USER } from './matches.types';
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

		const activeCount = await this.getActiveMatchesCount(author);
		if (activeCount >= MAX_ACTIVE_MATCHES_PER_USER) {
			throw new BadRequestException(
				`Limit: ${MAX_ACTIVE_MATCHES_PER_USER} active matches maximum at a time. Wait for them to finish or delete them manually.`,
			);
		}

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

	async getUserMatchesAll({
		username,
		category,
		page = 1,
		limit = 25,
	}: {
		username: string;
		category: 'live' | 'planned' | 'finished';
		page?: number;
		limit?: number;
	}): Promise<{ matches: Match[]; total: number; page: number; limit: number; totalPages: number }> {
		this.logger.log('getUserMatchesAll called');

		const user = await this.db.query.users.findFirst({
			where: eq(sc.users.username, username),
			columns: { id: true },
		});

		if (!user) {
			throw new Error('User not found');
		}

		const categoryStatusMap = {
			live: ['in_progress'],
			planned: ['waiting', 'processing'],
			finished: ['finished'],
		};

		const statusFilter = categoryStatusMap[category];

		const ownedMatches = await this.db
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
			.innerJoin(sc.analysis, eq(sc.analysis.id, sc.matches.id))
			.innerJoin(
				sc.plannedBroadcasts,
				eq(sc.matches.id, sc.plannedBroadcasts.matchId),
			)
			.where(eq(sc.plannedBroadcasts.userId, user.id));

		const followedMatches = await this.db
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
			.innerJoin(sc.analysis, eq(sc.analysis.id, sc.matches.id))
			.innerJoin(
				sc.followedBroadcasts,
				eq(sc.matches.id, sc.followedBroadcasts.matchId),
			)
			.where(eq(sc.followedBroadcasts.userId, user.id));

		const followedSet = new Set(followedMatches.map((m) => m.id));

		const allMatches = Array.from(
			new Map(
				[...followedMatches, ...ownedMatches].map((m) => [m.id, m])
			).values()
		);

		const filteredMatches = allMatches
			.map((m) => ({ ...m, isFollowed: followedSet.has(m.id) }))
			.filter((m) => statusFilter.includes(m.status));

		const total = filteredMatches.length;

		const paginatedMatches = filteredMatches
			.sort((a, b) => {
				// followed матчи идут первыми
				if (a.isFollowed && !b.isFollowed) return -1;
				if (!a.isFollowed && b.isFollowed) return 1;
				// затем сортировка по дате
				const aTime = a.newestMoveAt?.getTime() || 0;
				const bTime = b.newestMoveAt?.getTime() || 0;
				return bTime - aTime;
			})
			.slice((page - 1) * limit, page * limit);

		const viewerCounts = await Promise.all(
			paginatedMatches.map((match) => this.redisService.getViewerData(match.id)),
		);

		const matches = paginatedMatches.map((match, index) => ({
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
			isFollowed: match.isFollowed,
		}));

		return {
			matches,
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		};
	}

	async getMatchesByTable({
		table,
		isJoinTable,
		username,
		status,
		page = 1,
		limit = 25,
		paginate = false,
	}: {
		table: PgTableWithColumns<any>;
		isJoinTable: boolean;
		username?: string;
		status?: Match['status'];
		page?: number;
		limit?: number;
		paginate?: boolean;
	}): Promise<{ matches: Match[]; total: number; page: number; limit: number; totalPages: number } | Match[]> {
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

		if (paginate) {
			const countQuery = this.db
				.select({ count: sc.matches.id })
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

				countQuery
					.innerJoin(table, eq(sc.matches.id, table.matchId as string))
					.where(eq(table.userId, user.id));
			} else if (status) {
				countQuery.where(eq(sc.matches.status, status));
			}

			const totalResult = await countQuery;
			const total = totalResult.length;

			const raw = await query.orderBy(desc(sc.matches.createdAt)).limit(limit).offset((page - 1) * limit);
			const viewerCounts = await Promise.all(
				raw.map((match) => this.redisService.getViewerData(match.id)),
			);

			const matches = raw.map((match, index) => ({
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

			return {
				matches,
				total,
				page,
				limit,
				totalPages: Math.ceil(total / limit),
			};
		} else {
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

	async deleteMatch(matchId: string, username: string): Promise<void> {
		this.logger.log('deleteMatch called', JSON.stringify({ matchId, username }));

		const match = await this.db.query.matches.findFirst({
			where: eq(sc.matches.id, matchId),
		});

		if (!match) {
			throw new BadRequestException('Match not found');
		}

		if (match.author !== username) {
			throw new BadRequestException('Only the match author can delete it');
		}

		await this.db.delete(sc.matches).where(eq(sc.matches.id, matchId));

		await this.redisService.clearMatchData(matchId);
	}

	private async getActiveMatchesCount(username: string): Promise<number> {
		const result = await this.db
			.select({ count: count() })
			.from(sc.matches)
			.where(
				and(
					eq(sc.matches.author, username),
					ne(sc.matches.status, 'finished'),
				),
			);
		return Number(result[0].count);
	}
}

import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as sc from '../schema';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import { eq, sql, and, lte, desc } from 'drizzle-orm';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { PgTableWithColumns } from 'drizzle-orm/pg-core';
import { Cron, CronExpression } from '@nestjs/schedule';
import { requestArchetypes } from "src/matches/utils/archetype";
import { PlayersService } from 'src/players/players.service';
import { RedisService } from 'src/redis/redis.service';
import { Chess } from 'chess.js';

export interface gameState {
	isStarted: boolean,
	history: string[]
}

export interface Match {
	id: string,
	title: string,
	author: string,
	white: { name: string; time: string; timeMs?: number },
	black: { name: string; time: string; timeMs?: number },
	status: "waiting"|"in_progress"|"finished",
	timeControl: number,
	fen: string,
	viewerCount: number,
}

const archetypeOptions = {
	"Desired archetype. Keep empty if unsure": undefined,
	"Calculator": "calculator",
	"Intuitive Genius": "intuitive",
	"Chaos Attacker": "attacker",
	"Solid Pragmatist": "pragmatic",
	"Time Trouble Addict": "time_trouble",
	"Iron Fortress": "fortress",
	"Blunder Prone Gambler": "gambler",
	"Perfectionist": "perfectionist",
	"Tactical Berserker": "berserker",
	"Speed Demon": "speed_demon",
	"Psychological Grinder": "grinder",
};

const formatTime = (seconds: number): string => {
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = seconds % 60;
	const mm = m.toString().padStart(2, '0');
	const ss = s.toString().padStart(2, '0');
	
	if (h < 1) return `${mm}:${ss}`;
	else return `${h}:${mm}:${ss}`;
};

@Injectable()
export class MatchesService {
	constructor(
		@Inject(DrizzleAsyncProvider) private db: NodePgDatabase<typeof sc>,
		@Inject(PlayersService) private playersService: PlayersService,
		@InjectQueue('analysis') private analysisQueue: Queue,
		@InjectQueue('timer') private timerQueue: Queue,
		@Inject(RedisService) private redisService: RedisService
		
	) {}

	private readonly logger = new Logger(MatchesService.name);

	private getValidArchetype(key: string | undefined): string | undefined {
		return archetypeOptions[key as keyof typeof archetypeOptions];
}

	async createBroadcast(authorId: number, author: string, title: string, scheduledAt: Date, pgn: string, whitePlayer: string, blackPlayer: string, archetypes: [string, string], timeControl: number) {
		let validatedArchetypes: [string|undefined, string|undefined] = [
			this.getValidArchetype(archetypes[0]),
			this.getValidArchetype(archetypes[1])
		];
		let isArchetypeAiGenerated: boolean[] = [false, false];
		const archetypeMask = (validatedArchetypes[0] !== undefined ? 1 : 0) + (validatedArchetypes[1] !== undefined ? 2 : 0);
		switch (archetypeMask) {
			case 0:
				const { results, isAiGenerated } = await requestArchetypes({player1: whitePlayer, player2: blackPlayer});
				validatedArchetypes = results.map((archetype: string) => this.getValidArchetype(archetype)) as [string, string];
				isArchetypeAiGenerated = isAiGenerated;
				break;
			case 1:
				const res1 = await requestArchetypes({player2: blackPlayer});
				validatedArchetypes[1] = this.getValidArchetype(res1.results[0]);
				isArchetypeAiGenerated[1] = res1.isAiGenerated[0];
				break;
			case 2:
				const res2 = await requestArchetypes({player1: whitePlayer});
				validatedArchetypes[0] = this.getValidArchetype(res2.results[0]);
				isArchetypeAiGenerated[0] = res2.isAiGenerated[0];
				break;
			case 3:
				break;
		}

		console.log(`Validated archetypes for ${whitePlayer} and ${blackPlayer}:`, validatedArchetypes, "AI Generated Flags:", isArchetypeAiGenerated);
		
		if (isArchetypeAiGenerated[0] && whitePlayer) {
			await this.playersService.updateArchetype(whitePlayer, validatedArchetypes[0]!);
		}

		if (isArchetypeAiGenerated[1] && blackPlayer) {
			await this.playersService.updateArchetype(blackPlayer, validatedArchetypes[1]!);
		}

		const [analysis] = await this.db
			.insert(sc.analysis)
			.values({
				pgn: pgn
			})
			.returning();

		await this.db
			.insert(sc.matches)
			.values({
				id: analysis.id,
				author: author,
				title: title,
				whitePlayer: whitePlayer,
				blackPlayer: blackPlayer,
				whitePlayerTime: timeControl*1000,
				blackPlayerTime: timeControl*1000,
				status: 'waiting',
				history: [],
				timeControl: timeControl,
				scheduledAt: scheduledAt
			});
		
		await this.db.insert(sc.plannedBroadcasts).values({
			userId: authorId,
			matchId: analysis.id,
		});

		await this.analysisQueue.add('analyze', {
			id: analysis.id,	
			pgn: pgn,
			time_control: timeControl,
			archetypes: validatedArchetypes
		}, {
			attempts: 3, 
			backoff: 5000 
		});
		return analysis;
	}


	async handleWorkerReport(id: string, evaluations: number[], durations: number[], notation: string[]) {
		const [broadcast] = await this.db
			.update(sc.analysis)
			.set({
				evaluations: evaluations,
				durations: durations,
				notation: notation
			})
			.where(eq(sc.analysis.id, id))
			.returning();
		return broadcast;
	}


	async startBroadcast(id: string) {
		const [match] = await this.db
			.update(sc.matches)
			.set({status:"in_progress"})
			.where(eq(sc.matches.id, id))
			.returning();

		await this.timerQueue.remove(`timer_${id}`);
		await this.timerQueue.add(
			'nextStep',
			{ matchId: id, moveIndex: 0 },
			{ 
				removeOnComplete: true, 
				removeOnFail: true
			}
		);

		return { status: 'in_progress', matchId: id };
	}

	
	@Cron(CronExpression.EVERY_MINUTE)
	async autoCheckAndStartBroadcasts() {
		const now = new Date();

		const started = await this.db
			.update(sc.matches)
			.set({ status: 'in_progress' })
			.where(
				and(
					eq(sc.matches.status, 'waiting'),
					lte(sc.matches.scheduledAt, now)
				)
			)
			.returning({ id: sc.matches.id });

		for (const match of started) {
			try {
				await this.timerQueue.remove(`timer_${match.id}`);
				await this.timerQueue.add(
					'nextStep',
					{ matchId: match.id, moveIndex: 0 },
					{ removeOnComplete: true, removeOnFail: true }
				);
			} catch (err) {
				this.logger.error(`Ошибка запуска таймера для ${match.id}:`, err);
			}
		}
	}

	async updateGameState(id: string, move: string) {
		const game = await this.db.query.matches.findFirst({
			where: eq(sc.matches.id, id),
		});
		
		const analysis = await this.db.query.analysis.findFirst({
			where: eq(sc.analysis.id, id),
		});

		if (!game) throw new Error('Match not found');
		if (!analysis) throw new Error('Analysis not found');

		const chess = new Chess(game.fen);

		chess.move(move);

		const newFen = chess.fen();
		let updatedMatch;

		const moveIndex = game.history ? game.history.length : 0;
		const moveDuration = analysis.durations[moveIndex] || 0;
		const isWhiteMove = moveIndex % 2 === 0;

		const commonUpdate = {
		    fen: newFen,
		    history: sql`array_append(${sc.matches.history}, ${move})`,
		    whitePlayerTime: isWhiteMove 
		        ? game.whitePlayerTime - moveDuration 
		        : game.whitePlayerTime,
		    blackPlayerTime: !isWhiteMove 
		        ? game.blackPlayerTime - moveDuration 
		        : game.blackPlayerTime,
		};

		if (game.status === 'waiting') {
			[updatedMatch] = await this.db
				.update(sc.matches)
				.set({
					...commonUpdate,
					status: 'in_progress',
					history: [move],
				})
				.where(eq(sc.matches.id, id))
				.returning();
		} else if (game.status === 'in_progress') {
			[updatedMatch] = await this.db
				.update(sc.matches)
				.set(commonUpdate)
				.where(eq(sc.matches.id, id))
				.returning();
		} else {
			return game;
		}

		return updatedMatch;
	}


	async checkGameState(id: string) {
		const match = await this.db.query.matches.findFirst({
			where: eq(sc.matches.id, id),
		});

		if (!match) {
			return null;
		}

		const user = await this.db.query.users.findFirst({
			where: eq(sc.users.username, match.author),
		});

		if (!user) {
			return null;
		}

		const viewerData = await this.redisService.getViewerData(id);
		const viewers = viewerData.count + viewerData.guestCount || 0;

		const dto: Match = {
			id: match.id,
			title: match.title,
			author: match.author,
			timeControl: match.timeControl,
			status: match.status,
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
			fen: match.fen,
			viewerCount: viewers,
		};

		return dto;
	}


	async finishGame(id: string) {
		await this.db
			.update(sc.matches)
			.set({status: "finished"})
			.where(eq(sc.matches.id, id));
	}


	private async getMatchesByJoinTable(
		joinTable: PgTableWithColumns<any>, 
		userId: number,
		limit?: number
	) {
		return await this.db
			.select({
				id: sc.matches.id,
				title: sc.matches.title,
				scheduledAt: sc.matches.createdAt,
				status: sc.matches.status,
			})
			.from(joinTable)
			.innerJoin(
				sc.matches, 
				eq(joinTable.matchId, sc.matches.id)
			)
			.where(eq(joinTable.userId, userId));
	}

	async checkMyFollowedMatches(userId: number) {
		return this.getMatchesByJoinTable(sc.followedBroadcasts, userId);
	}

	async checkMyPlannedMatches(userId: number) {
		return this.getMatchesByJoinTable(sc.plannedBroadcasts, userId);
	}


	async getMatchesByStatus(status: "waiting" | "in_progress" | "finished"): Promise<Match[]> {
		const raw = await this.db
			.select({
				id: sc.matches.id,
				author: sc.users.username,
				title: sc.matches.title,
				status: sc.matches.status,
				whitePlayer: sc.matches.whitePlayer,
				blackPlayer: sc.matches.blackPlayer,
				whitePlayerTime: sc.matches.whitePlayerTime,
				blackPlayerTime: sc.matches.blackPlayerTime,
				timeControl: sc.matches.timeControl,
				fen: sc.matches.fen
			})
			.from(sc.matches)
			.innerJoin(sc.users, eq(sc.matches.author, sc.users.username))
			.where(eq(sc.matches.status, status))
			.orderBy(desc(sc.matches.createdAt))
			.limit(10);

		const viewerCounts = await Promise.all(raw.map(match => this.redisService.getViewerData(match.id)));

		return raw.map((match, index) => {
			const viewers = viewerCounts[index].count + viewerCounts[index].guestCount || 0;
			const dto: Match = {
				id: match.id,
				title: match.title,
				author: match.author,
				timeControl: match.timeControl,
				status: match.status,
				white: { name: match.whitePlayer, time: formatTime(match.whitePlayerTime), timeMs: match.whitePlayerTime },
				black: { name: match.blackPlayer, time: formatTime(match.blackPlayerTime), timeMs: match.blackPlayerTime },
				fen: match.fen,
				viewerCount: viewers,
			};
			return dto;
		});
	}
}
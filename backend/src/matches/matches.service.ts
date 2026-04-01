import { Injectable, Inject, NotFoundException, Logger, forwardRef } from '@nestjs/common';
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
import { MatchesGateway } from './matches.gateway';

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
	status: "processing"|"waiting"|"in_progress"|"finished",
	timeControl: number,
	fen: string,
	viewerCount: number,
	history?: string[] | null,
	evaluations?: number[] | null
	outcome?: string,
	newestMoveAt?: number
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
		@Inject(RedisService) private redisService: RedisService,
		@Inject(forwardRef(() => MatchesGateway)) private readonly gateway: MatchesGateway,
	) {
		this.logger.log('constructor called');
	}

	private readonly logger = new Logger(MatchesService.name);

	private getValidArchetype(key: string): string | undefined {
		this.logger.log('getValidArchetype called');
		return archetypeOptions[key as keyof typeof archetypeOptions];
	}

	private async archetypeValidation(whitePlayer: string, blackPlayer: string, archetypes: [string, string]) {
		this.logger.log('archetypeValidation called');
		const [whiteDB, blackDB] = await Promise.all([
			this.playersService.getArchetypeFromDB(whitePlayer),
			this.playersService.getArchetypeFromDB(blackPlayer)
		]);
		let validatedArchetypes: [string|undefined, string|undefined] = [
			this.getValidArchetype(archetypes[0]) || whiteDB,
			this.getValidArchetype(archetypes[1]) || blackDB 
		];
		let isArchetypeAiGenerated: boolean[] = [false, false];
		const archetypeMask = (validatedArchetypes[0] === undefined ? 0 : 1) + (validatedArchetypes[1] === undefined ? 0 : 2);
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
				this.logger.log(`Both archetypes were taken from DB or from user input: ${validatedArchetypes}`)
				break;
		}

		this.logger.log(`Validated archetypes for ${whitePlayer} and ${blackPlayer}:`, validatedArchetypes, "AI Generated Flags:", isArchetypeAiGenerated);
		
		if (isArchetypeAiGenerated[0] && whitePlayer) {
			await this.playersService.updateArchetype(whitePlayer, validatedArchetypes[0]!);
		}

		if (isArchetypeAiGenerated[1] && blackPlayer) {
			await this.playersService.updateArchetype(blackPlayer, validatedArchetypes[1]!);
		}

		return validatedArchetypes;
	}

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
		newTimeIncrement: number = 0
	) {
		this.logger.log('createBroadcast called');
		
		const validatedArchetypes = await this.archetypeValidation(whitePlayer, blackPlayer, archetypes);

		const [analysis] = await this.db
			.insert(sc.analysis)
			.values({
				pgn: pgn,
				timeControl: timeControl,
				controlMove: controlMove,
				increment: timeIncrement,
				bonusTimeMin: bonusTimeMin,
				newControlMoveEvery: nextControlMoveAfter,
				newIncrement: newTimeIncrement,
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
				status: 'processing',
				moveIndex: 0,
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
			control_move: controlMove,
			time_increment: timeIncrement,
			bonus_time_min: bonusTimeMin,
			next_control_move_after: nextControlMoveAfter,
			new_time_increment: newTimeIncrement,
			archetypes: validatedArchetypes
		}, {
			attempts: 3, 
			backoff: 5000 
		});
		return analysis;
	}

	async handleWorkerReport(id: string, evaluations: number[], timesRemaining: number[], notation: string[], outcome: '1/2-1/2'|'1-0'|'0-1') {
		this.logger.log('handleWorkerReport called');
		this.logger.log(id, evaluations, timesRemaining, notation)
		await this.db
			.update(sc.analysis)
			.set({
				evaluations: evaluations,
				timesRemaining: timesRemaining,
				notation: notation,
				outcome: outcome
			})
			.where(eq(sc.analysis.id, id));
		await this.db
			.update(sc.matches)
			.set({
				status: "waiting"
			})
			.where(eq(sc.matches.id, id));
		this.gateway.server.to(`is_processing:${id}`).emit("no_more_processing", { matchId: id });
	}

	async startBroadcast(id: string) {
		this.logger.log('startBroadcast called');
		await this.db
			.update(sc.matches)
			.set({
				status: "in_progress",
				moveIndex: 0,
				newestMoveAt: new Date()
			})
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
		this.logger.log('autoCheckAndStartBroadcasts called');
		const now = new Date();

		const started = await this.db
			.update(sc.matches)
			.set({
				status: 'in_progress',
				moveIndex: 0,
				newestMoveAt: new Date()
			})
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
		this.logger.log('updateGameState called');
		const game = await this.db.query.matches.findFirst({
			where: eq(sc.matches.id, id),
		});
		
		const analysis = await this.db.query.analysis.findFirst({
			where: eq(sc.analysis.id, id),
		});

		if (!game) throw new Error('Match not found');
		if (!analysis) throw new Error('Analysis not found');

		const { 
			controlMove,
			newControlMoveEvery,
			bonusTimeMin,
			increment,
			newIncrement,
			timesRemaining
		} = analysis;

		const {
			fen,
			moveIndex,
			lastControlMove,
			whitePlayerTime,
			blackPlayerTime
		} = game;

		const chess = new Chess(fen);

		chess.move(move);

		const isGameOver = chess.isGameOver();
		const nextMoveExists = moveIndex + 1 < timesRemaining.length;

		const newFen = chess.fen();
		const isWhiteMove = moveIndex % 2 === 0;

		const timeBeforeMove = isWhiteMove ? whitePlayerTime : blackPlayerTime;
		const timeAfterMove = timesRemaining[moveIndex] ?? timeBeforeMove;

		const currentIncrementMs = 1000 * (controlMove == 0 || moveIndex/2 < controlMove ?
			increment
			: newIncrement);
		
		let bonusTimeMs = 0;
		let lastControlMoveVar = lastControlMove;

		if (controlMove !== 0) {
			const moveNumber = Math.floor(moveIndex / 2) + 1;
			const nextControl = lastControlMove === 0 
				? controlMove 
				: lastControlMove + newControlMoveEvery;

			if (moveNumber === nextControl) {
				bonusTimeMs = bonusTimeMin * 60000;
				if (!isWhiteMove) lastControlMoveVar = nextControl;
			}
		}

		const delay = isGameOver || !nextMoveExists 
			? 0 
			: Math.max(0, (timeBeforeMove + currentIncrementMs + bonusTimeMs) - timeAfterMove);

		const [updatedMatch] = await this.db
			.update(sc.matches)
			.set({
				fen: newFen,
				moveIndex: moveIndex + 1,
				lastControlMove: lastControlMoveVar,
				whitePlayerTime: isWhiteMove ? timeAfterMove : whitePlayerTime,
				blackPlayerTime: !isWhiteMove ? timeAfterMove : blackPlayerTime,
				newestMoveAt: new Date()
			})
			.where(eq(sc.matches.id, id))
			.returning();

		return { updatedMatch, delay };
	}

	async checkGameState(id: string) {
		this.logger.log('checkGameState called');
		const match = await this.db.query.matches.findFirst({
			where: eq(sc.matches.id, id),
		});

		const analysis = await this.db.query.analysis.findFirst({
			where: eq(sc.analysis.id, id),
		});

		if (!match || !analysis) {
			return null
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
			timeControl: analysis.timeControl,
			status: match.status,
			evaluations: analysis.evaluations.slice(0, match.moveIndex),
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
			outcome: analysis.outcome,
			newestMoveAt: match.newestMoveAt.getTime()
		};

		return dto;
	}

	async finishGame(id: string) {
		this.logger.log('finishGame called');
		await this.db
			.update(sc.matches)
			.set({status: "finished"})
			.where(eq(sc.matches.id, id));
	}

	async getMatchesByTable({
		table,
		isJoinTable,
		userId,
		status
	}: {
		table: PgTableWithColumns<any>, 
		isJoinTable: boolean,
		userId?: number,
		status?: "processing"|"waiting"|"in_progress"|"finished"
	}) {
		this.logger.log('getMatchesByTable called');
		let query = this.db
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
				newestMoveAt: sc.matches.newestMoveAt
			})
			.from(sc.matches)
			.innerJoin(sc.users, eq(sc.matches.author, sc.users.username))
			.innerJoin(sc.analysis, eq(sc.analysis.id, sc.matches.id));
			
		if (isJoinTable) {
			query.innerJoin(table, eq(sc.matches.id, table.matchId));
			query.where(eq(table.userId, userId!));
		} else {
			query.where(eq(sc.matches.status, status!));
		}
		query.orderBy(desc(sc.matches.createdAt));
		query.limit(10);

		const raw = await query;
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
				newestMoveAt: match.newestMoveAt.getTime()
			};
			return dto;
		});
	}
}

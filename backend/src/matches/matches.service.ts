import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as sc from '../schema';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import { eq, or, sql } from 'drizzle-orm';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { PgTableWithColumns } from 'drizzle-orm/pg-core';

export interface gameState {
	isStarted: boolean,
	history: string[]
}

@Injectable()
export class MatchesService {
	constructor(
		@Inject(DrizzleAsyncProvider) private db: NodePgDatabase<typeof sc>,
		@InjectQueue('analysis') private analysisQueue: Queue,
		@InjectQueue('timer') private timerQueue: Queue
	) {}

	async createBroadcast(authorId: number, author: string, title: string, scheduledAt: Date, pgn: string, archetypes: [string, string]) {
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
				whitePlayer: "Александр Алехин",
				blackPlayer: "Хосе Рауль Капабланка",
				status: 'waiting',
				history: [],
				timeControl: 9000,
				scheduledAt: scheduledAt
			});
		
		await this.db.insert(sc.plannedBroadcasts).values({
			userId: authorId,
			matchId: analysis.id,
		});

		await this.analysisQueue.add('analyze', {
			id: analysis.id,	
			pgn: pgn,
			archetypes: archetypes
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
			.select()
			.from(sc.analysis)
			.where(eq(sc.analysis.id, id))
			.limit(1);

		if (!match) {
			throw new NotFoundException('Broadcast not found');
		}

		await this.timerQueue.remove(`timer_${id}`);

		await this.timerQueue.add(
			'nextStep',
			{ matchId: id, moveIndex: 0 },
			{ 
				removeOnComplete: true, 
				removeOnFail: true
			}
		);
		console.log("Таймер до второго хода создан!")

		return { status: 'in_progress', matchId: id };
	}

	async updateGameState(id: string, move: string) {
		const game = await this.db.query.matches.findFirst({
			where: eq(sc.matches.id, id),
		});

		if (!game) throw new Error('Match not found');

		let updatedMatch;

		switch (game.status) {
			case "waiting":
				[updatedMatch] = await this.db
					.update(sc.matches)
					.set({
						status: 'in_progress',
						history: [move],
					})
					.where(eq(sc.matches.id, id))
					.returning();
				break;

			case "in_progress":
				[updatedMatch] = await this.db
					.update(sc.matches)
					.set({
						history: sql`array_append(${sc.matches.history}, ${move})`,
					})
					.where(eq(sc.matches.id, id))
					.returning();
				break;
				
				default:
					return game;
		}

		return updatedMatch;
	}

	async checkGameState(id: string): Promise<gameState> {
		const match = await this.db.query.matches.findFirst({
			where: eq(sc.matches.id, id),
		});

		if (!match) {
			return { isStarted: false, history: [] };
		}

		const isStarted = !(match.status === 'waiting')

		return { isStarted: isStarted, history: match.history };
	}

	async finishGame(id: string) {
		await this.db
			.update(sc.matches)
			.set({status: "finished"})
			.where(eq(sc.matches.id, id));
	}

	private async getMatchesByJoinTable(
			joinTable: PgTableWithColumns<any>, 
			userId: number
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

		async checkFollowedMatches(userId: number) {
			return this.getMatchesByJoinTable(sc.followedBroadcasts, userId);
		}

		async checkPlannedMatches(userId: number) {
			return this.getMatchesByJoinTable(sc.plannedBroadcasts, userId);
		}
}
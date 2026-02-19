import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as sc from '../schema';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import * as q from 'drizzle-orm';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';


@Injectable()
export class MatchesService {
	constructor(
		@Inject(DrizzleAsyncProvider) private db: NodePgDatabase<typeof sc>,
		@InjectQueue('analysis') private matchesQueue: Queue,
	) {}

	async createBroadcast(author: string, pgn: string, archetypes: [string, string]) {
		const [broadcast] = await this.db
			.insert(sc.analysis)
			.values({
				author: author,
				pgn: pgn
			})
			.returning();
		await this.matchesQueue.add('analyze', {
			id: broadcast.id,	
			pgn: pgn,
			archetypes: archetypes
		}, {
			attempts: 3, 
			backoff: 5000 
		});
		return broadcast;
	}

	async handleWorkerReport(id: string, evaluations: number[], durations: number[], notation: string[]) {
		const [broadcast] = await this.db
			.update(sc.analysis)
			.set({
				evaluations: evaluations,
				durations: durations,
				notation: notation
			})
			.where(q.eq(sc.analysis.id, id))
			.returning();
		return broadcast;
	}
}
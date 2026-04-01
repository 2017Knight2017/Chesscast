import { Injectable, Inject, Logger, forwardRef } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import * as sc from '../schema';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import { MatchesGateway } from './matches.gateway';

@Injectable()
export class LifecycleService {
	private readonly logger = new Logger(LifecycleService.name);

	constructor(
		@Inject(DrizzleAsyncProvider) private db: NodePgDatabase<typeof sc>,
		@InjectQueue('timer') private timerQueue: Queue,
		@Inject(forwardRef(() => MatchesGateway)) private readonly gateway: MatchesGateway,
	) {}

	async handleWorkerReport(id: string, evaluations: number[], timesRemaining: number[], notation: string[], outcome: '1/2-1/2'|'1-0'|'0-1') {
		this.logger.log(`handleWorkerReport called for ${id}`);
		
		await this.db.update(sc.analysis).set({ evaluations, timesRemaining, notation, outcome }).where(eq(sc.analysis.id, id));
		await this.db.update(sc.matches).set({ status: "waiting" }).where(eq(sc.matches.id, id));
		
		this.gateway.server.to(`is_processing:${id}`).emit("no_more_processing", { matchId: id });
	}

	async startBroadcast(id: string) {
		this.logger.log(`startBroadcast called for ${id}`);
		
		await this.db.update(sc.matches)
			.set({ status: "in_progress", moveIndex: 0, newestMoveAt: new Date() })
			.where(eq(sc.matches.id, id));

		await this.timerQueue.remove(`timer_${id}`);
		await this.timerQueue.add('nextStep', { matchId: id, moveIndex: 0 }, { removeOnComplete: true, removeOnFail: true });

		return { status: 'in_progress', matchId: id };
	}

	async finishGame(id: string) {
		this.logger.log(`finishGame called for ${id}`);
		await this.db.update(sc.matches).set({ status: "finished" }).where(eq(sc.matches.id, id));
	}
}
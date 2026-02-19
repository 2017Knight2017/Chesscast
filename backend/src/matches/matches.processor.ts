import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { Inject, forwardRef } from '@nestjs/common';
import { MatchesGateway } from './matches.gateway';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import * as sc from '../schema';
import { eq, and } from 'drizzle-orm';

// Интерфейс данных, которые мы передаем в задачу Redis
interface BroadcastJobData {
	broadcastId: string;
	nextMoveNumber: number; // Номер хода, который нужно сейчас показать
}

@Processor('match-timers')
export class MatchesProcessor extends WorkerHost {
	constructor(
		@Inject(forwardRef(() => MatchesGateway)) private readonly gateway: MatchesGateway,
		@Inject(DrizzleAsyncProvider) private db: NodePgDatabase<typeof sc>,
		@InjectQueue('timer') private timerQueue: Queue,
	) {
		super();
	}

	async process(job: Job<{ matchId: string; moveIndex: number }>): Promise<void> {
		const { matchId, moveIndex } = job.data;

		const [broadcast] = await this.db
			.select()
			.from(sc.analysis)
			.where(eq(sc.analysis.id, matchId))
			.limit(1);

		if (!broadcast) {
			console.error(`Broadcast ${matchId} not found`);
			return;
		}

		if (moveIndex >= broadcast.notation.length) {
			this.gateway.server.to(matchId).emit('broadcastEnded', { matchId });
			return;
		}

		this.gateway.server.to(matchId).emit('newMove', {
			move: broadcast.notation[moveIndex],
			evaluation: broadcast.evaluations[moveIndex],
			nextMoveDelay: broadcast.durations[moveIndex],
			moveIndex: moveIndex,
		});

		const nextIndex = moveIndex + 1;
		
		if (nextIndex < broadcast.notation.length) {
			const delay = broadcast.durations[moveIndex] || 1000;

			await this.timerQueue.add(
				'nextStep',
				{ matchId, moveIndex: nextIndex },
				{
					delay: delay,
					jobId: `timer_${matchId}`,
					removeOnComplete: true,
				},
			);
		}
	}
}
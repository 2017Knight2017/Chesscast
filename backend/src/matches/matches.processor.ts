import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { Inject, forwardRef } from '@nestjs/common';
import { MatchesGateway } from './matches.gateway';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import * as sc from '../schema';
import { eq } from 'drizzle-orm';
import { MatchesService } from './matches.service';


@Processor('timer')
export class MatchesProcessor extends WorkerHost {
	constructor(
		private readonly matchesService: MatchesService,
		@Inject(forwardRef(() => MatchesGateway)) private readonly gateway: MatchesGateway,
		@Inject(DrizzleAsyncProvider) private db: NodePgDatabase<typeof sc>,
		@InjectQueue('timer') private timerQueue: Queue,
	) {
		super();
		console.log('[MatchesProcessor] constructor called');
	}

	async process(job: Job<{ matchId: string; moveIndex: number }>): Promise<void> {
		console.log('[MatchesProcessor] process called');
		const { matchId, moveIndex } = job.data;

		const [analysis] = await this.db
			.select()
			.from(sc.analysis)
			.where(eq(sc.analysis.id, matchId))
			.limit(1);

		const currentMoveNotation = analysis.notation[moveIndex];
		
		const {updatedMatch, delay} = await this.matchesService.updateGameState(matchId, currentMoveNotation);

		this.gateway.server.to(matchId).emit('new_move', {
			matchId,
			move: currentMoveNotation,
			evaluation: analysis.evaluations[moveIndex],
			fen: updatedMatch.fen,
			whiteTimeMs: updatedMatch.whitePlayerTime,
			blackTimeMs: updatedMatch.blackPlayerTime,
		});

		const nextIndex = moveIndex + 1;
		if (nextIndex < analysis.notation.length) {
			await this.timerQueue.add(
				'nextStep',
				{ matchId, moveIndex: nextIndex },
				{
					delay: delay,
					jobId: `timer_${matchId}_${nextIndex}`,
					removeOnComplete: true,
				},
			);
		} else {
			this.gateway.server.to(matchId).emit('match_finished', { matchId, outcome: analysis.outcome });
			await this.matchesService.finishGame(matchId);
		}
	}
}
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
	}

	async process(job: Job<{ matchId: string; moveIndex: number }>): Promise<void> {
	    const { matchId, moveIndex } = job.data;

	    const [analysis] = await this.db
	        .select()
	        .from(sc.analysis)
	        .where(eq(sc.analysis.id, matchId))
	        .limit(1);

	    const currentMoveNotation = analysis.notation[moveIndex];
		
	    const updatedMatch = await this.matchesService.updateGameState(matchId, currentMoveNotation);

	    this.gateway.server.to(matchId).emit('newMove', {
	        move: currentMoveNotation,
	        evaluation: analysis.evaluations[moveIndex],
	        nextMoveDelay: analysis.durations[moveIndex],
	        moveIndex: moveIndex,
	        history: updatedMatch.history, 
	        fen: updatedMatch.fen,
	        whiteTimeMs: updatedMatch.whitePlayerTime,
	        blackTimeMs: updatedMatch.blackPlayerTime,
	    });

	    const nextIndex = moveIndex + 1;
	    if (nextIndex < analysis.notation.length) {
	        const delay = analysis.durations[moveIndex] || 1000;

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
	        await this.matchesService.finishGame(matchId);
	    }
	}
}
import { Injectable, Inject, Logger } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { Chess } from 'chess.js';
import * as sc from '../schema';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';

@Injectable()
export class EngineService {
	private readonly logger = new Logger(EngineService.name);

	constructor(
		@Inject(DrizzleAsyncProvider) private db: NodePgDatabase<typeof sc>,
	) {}

	async processMove(id: string, move: string) {
		this.logger.log(`processMove called for match ${id}`);

		const game = await this.db.query.matches.findFirst({
			where: eq(sc.matches.id, id),
		});
		const analysis = await this.db.query.analysis.findFirst({
			where: eq(sc.analysis.id, id),
		});

		if (!game || !analysis) throw new Error('Match or Analysis not found');

		const chess = new Chess(game.fen);
		chess.move(move);

		const isGameOver = chess.isGameOver();
		const isWhiteMove = game.moveIndex % 2 === 0;

		const timeAfterMove =
			analysis.timesRemaining[game.moveIndex] ??
			(isWhiteMove ? game.whitePlayerTime : game.blackPlayerTime);

		let lastControlMoveVar = game.lastControlMove;
		if (analysis.controlMove !== 0) {
			const moveNumber = Math.floor(game.moveIndex / 2) + 1;
			const nextControl =
				game.lastControlMove === 0
					? analysis.controlMove
					: game.lastControlMove + analysis.newControlMoveEvery;

			if (!isWhiteMove && moveNumber === nextControl) {
				lastControlMoveVar = nextControl;
			}
		}

		const [updatedMatch] = await this.db
			.update(sc.matches)
			.set({
				fen: chess.fen(),
				moveIndex: game.moveIndex + 1,
				lastControlMove: lastControlMoveVar,
				whitePlayerTime: isWhiteMove
					? timeAfterMove
					: game.whitePlayerTime,
				blackPlayerTime: !isWhiteMove
					? timeAfterMove
					: game.blackPlayerTime,
				newestMoveAt: new Date(),
			})
			.where(eq(sc.matches.id, id))
			.returning();

		let nextDelay = 0;
		const nextIndex = game.moveIndex + 1;

		if (!isGameOver && nextIndex < analysis.timesRemaining.length) {
			const isNextWhite = nextIndex % 2 === 0;

			const nextTimeBefore = isNextWhite
				? updatedMatch.whitePlayerTime
				: updatedMatch.blackPlayerTime;
			const nextTimeAfter =
				analysis.timesRemaining[nextIndex] ?? nextTimeBefore;

			const nextIncrementMs =
				1000 *
				(analysis.controlMove == 0 ||
				nextIndex / 2 < analysis.controlMove
					? analysis.increment
					: analysis.newIncrement);

			let nextBonusTimeMs = 0;
			if (analysis.controlMove !== 0) {
				const nextMoveNumber = Math.floor(nextIndex / 2) + 1;
				const nextControl =
					updatedMatch.lastControlMove === 0
						? analysis.controlMove
						: updatedMatch.lastControlMove +
							analysis.newControlMoveEvery;

				if (nextMoveNumber === nextControl) {
					nextBonusTimeMs = analysis.bonusTimeMin * 60000;
				}
			}

			nextDelay = Math.max(
				0,
				nextTimeBefore +
					nextIncrementMs +
					nextBonusTimeMs -
					nextTimeAfter,
			);
		}

		return {
			updatedMatch,
			nextDelay,
		};
	}
}

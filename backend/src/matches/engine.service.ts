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
		this.logger.log('processMove called');
		
		const game = await this.db.query.matches.findFirst({ where: eq(sc.matches.id, id) });
		const analysis = await this.db.query.analysis.findFirst({ where: eq(sc.analysis.id, id) });

		if (!game) throw new Error('Match not found');
		if (!analysis) throw new Error('Analysis not found');

		const chess = new Chess(game.fen);
		chess.move(move);

		const isGameOver = chess.isGameOver();
		const nextMoveExists = game.moveIndex + 1 < analysis.timesRemaining.length;
		const isWhiteMove = game.moveIndex % 2 === 0;

		const timeBeforeMove = isWhiteMove ? game.whitePlayerTime : game.blackPlayerTime;
		const timeAfterMove = analysis.timesRemaining[game.moveIndex] ?? timeBeforeMove;

		const currentIncrementMs = 1000 * (analysis.controlMove == 0 || game.moveIndex / 2 < analysis.controlMove 
			? analysis.increment 
			: analysis.newIncrement);
		
		let bonusTimeMs = 0;
		let lastControlMoveVar = game.lastControlMove;

		if (analysis.controlMove !== 0) {
			const moveNumber = Math.floor(game.moveIndex / 2) + 1;
			const nextControl = game.lastControlMove === 0 
				? analysis.controlMove 
				: game.lastControlMove + analysis.newControlMoveEvery;

			if (moveNumber === nextControl) {
				bonusTimeMs = analysis.bonusTimeMin * 60000;
				if (!isWhiteMove) lastControlMoveVar = nextControl;
			}
		}

		const delay = isGameOver || !nextMoveExists 
			? 0 
			: Math.max(0, (timeBeforeMove + currentIncrementMs + bonusTimeMs) - timeAfterMove);

		const [updatedMatch] = await this.db
			.update(sc.matches)
			.set({
				fen: chess.fen(),
				moveIndex: game.moveIndex + 1,
				lastControlMove: lastControlMoveVar,
				whitePlayerTime: isWhiteMove ? timeAfterMove : game.whitePlayerTime,
				blackPlayerTime: !isWhiteMove ? timeAfterMove : game.blackPlayerTime,
				newestMoveAt: new Date()
			})
			.where(eq(sc.matches.id, id))
			.returning();

		return { updatedMatch, delay };
	}
}
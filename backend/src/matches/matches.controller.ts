import { Controller, Post, Param, HttpCode, HttpStatus, Body, Inject, NotFoundException } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { eq } from 'drizzle-orm';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as sc from '../schema';

@Controller('matches')
export class MatchesController {
	constructor(
		private readonly matchesService: MatchesService,
		@Inject(DrizzleAsyncProvider) private db: NodePgDatabase<typeof sc>,
		@InjectQueue('timer') private readonly timerQueue: Queue,
	) {}

	@Post()
	@HttpCode(HttpStatus.CREATED) 
	async createBroadcast(
		@Body('author') author: string,
		@Body('pgn') pgn: string,
		@Body('archetypes') archetypes: [string, string]
	) {
		return await this.matchesService.createBroadcast(author, pgn, archetypes);
	}
	
	@Post(':id/report')
	async handleWorkerReport(
		@Param('id') id: string,
		@Body() data: { evaluations: number[], durations: number[], notation: string[] }
	) {
		return await this.matchesService.handleWorkerReport(id, data['evaluations'], data['durations'], data['notation'])
	}

	@Post(':id/start')
	async startBroadcast(@Param('id') id: string) {
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
				jobId: `timer_${id}`,
				removeOnComplete: true 
			}
		);

		return { status: 'started', matchId: id };
	}
		// Опционально: уведомляем фронтенд через WebSockets, что данные готовы
		//this.eventsGateway.notifyMatchReady(id); 
}
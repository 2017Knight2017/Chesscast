import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { and, eq, lte } from 'drizzle-orm';
import * as sc from '../schema';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import { LifecycleService } from './lifecycle.service';

@Injectable()
export class MatchCronService {
	private readonly logger = new Logger(MatchCronService.name);

	constructor(
		@Inject(DrizzleAsyncProvider) private db: NodePgDatabase<typeof sc>,
		private matchLifecycleService: LifecycleService,
	) {}

	@Cron(CronExpression.EVERY_MINUTE)
	async autoCheckAndStartBroadcasts() {
		this.logger.log('autoCheckAndStartBroadcasts called');
		const now = new Date();

		const started = await this.db
			.update(sc.matches)
			.set({
				status: 'in_progress',
				moveIndex: 0,
				newestMoveAt: new Date(),
			})
			.where(
				and(
					eq(sc.matches.status, 'waiting'),
					lte(sc.matches.scheduledAt, now),
				),
			)
			.returning({ id: sc.matches.id });

		for (const match of started) {
			try {
				await this.matchLifecycleService.startBroadcast(match.id);
			} catch (err) {
				this.logger.error(
					`Ошибка запуска таймера для ${match.id}:`,
					err,
				);
			}
		}
	}
}

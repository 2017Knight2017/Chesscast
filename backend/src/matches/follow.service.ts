import {
	Injectable,
	Inject,
	Logger,
	ConflictException,
	NotFoundException,
} from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { and, eq } from 'drizzle-orm';
import * as sc from '../schema';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';

@Injectable()
export class FollowService {
	private readonly logger = new Logger(FollowService.name);

	constructor(
		@Inject(DrizzleAsyncProvider) private db: NodePgDatabase<typeof sc>,
	) {}

	async followMatch(userId: number, matchId: string) {
		this.logger.log(
			`followMatch called: userId=${userId}, matchId=${matchId}`,
		);

		// Проверяем, существует ли матч
		const match = await this.db.query.matches.findFirst({
			where: eq(sc.matches.id, matchId),
		});

		if (!match) {
			throw new NotFoundException(`Match with id ${matchId} not found`);
		}

		// Проверяем, не подписан ли уже пользователь
		const existing = await this.db.query.followedBroadcasts.findFirst({
			where: and(
				eq(sc.followedBroadcasts.userId, userId),
				eq(sc.followedBroadcasts.matchId, matchId),
			),
		});

		if (existing) {
			throw new ConflictException('User already following this match');
		}

		// Добавляем подписку
		const [result] = await this.db
			.insert(sc.followedBroadcasts)
			.values({
				userId,
				matchId,
			})
			.returning();

		this.logger.log(`User ${userId} now follows match ${matchId}`);
		return result;
	}

	async unfollowMatch(userId: number, matchId: string) {
		this.logger.log(
			`unfollowMatch called: userId=${userId}, matchId=${matchId}`,
		);

		const result = await this.db
			.delete(sc.followedBroadcasts)
			.where(
				and(
					eq(sc.followedBroadcasts.userId, userId),
					eq(sc.followedBroadcasts.matchId, matchId),
				),
			);

		if (result.rowCount === 0) {
			throw new NotFoundException('Follow relationship not found');
		}

		this.logger.log(`User ${userId} unfollowed match ${matchId}`);
		return { success: true };
	}

	async isFollowing(userId: number, matchId: string): Promise<boolean> {
		const existing = await this.db.query.followedBroadcasts.findFirst({
			where: and(
				eq(sc.followedBroadcasts.userId, userId),
				eq(sc.followedBroadcasts.matchId, matchId),
			),
		});

		return !!existing;
	}
}

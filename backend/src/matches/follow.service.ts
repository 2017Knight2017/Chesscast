import {
	Injectable,
	Inject,
	Logger,
	ConflictException,
	NotFoundException,
} from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { and, eq, inArray } from 'drizzle-orm';
import * as sc from '../schema';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import { Match } from './matches.types';

@Injectable()
export class FollowService {
	private readonly logger = new Logger(FollowService.name);

	constructor(
		@Inject(DrizzleAsyncProvider) private db: NodePgDatabase<typeof sc>
	) {}

	async followMatch(userId: number, matchId: string) {
		this.logger.log(
			`followMatch called: userId=${userId}, matchId=${matchId}`,
		);

		const match = await this.db.query.matches.findFirst({
			where: eq(sc.matches.id, matchId),
		});

		if (!match) {
			throw new NotFoundException(`Match with id ${matchId} not found`);
		}

		const existing = await this.db.query.followedBroadcasts.findFirst({
			where: and(
				eq(sc.followedBroadcasts.userId, userId),
				eq(sc.followedBroadcasts.matchId, matchId),
			),
		});

		if (existing) {
			throw new ConflictException('User already following this match');
		}

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

	async getFollowed(userId: number): Promise<Match[]> {
		const matchIds = await this.db
			.select({matchId: sc.followedBroadcasts.matchId})
			.from(sc.followedBroadcasts)
			.where(eq(sc.followedBroadcasts.userId, userId));

		if (!matchIds || matchIds.length === 0) {
			return [];
		}

		const flatMatchIds = matchIds.map(row => row.matchId);
		const matches = await this.db
			.select({
				id: sc.matches.id,
				author: sc.users.username,
				title: sc.matches.title,
				status: sc.matches.status,
				whitePlayer: sc.matches.whitePlayer,
				blackPlayer: sc.matches.blackPlayer,
				whitePlayerTime: sc.matches.whitePlayerTime,
				blackPlayerTime: sc.matches.blackPlayerTime,
				timeControl: sc.analysis.timeControl,
				fen: sc.matches.fen,
				newestMoveAt: sc.matches.newestMoveAt,
			})
			.from(sc.matches)
			.where(inArray(sc.matches.id, flatMatchIds))
			.innerJoin(sc.users, eq(sc.matches.author, sc.users.username))
			.innerJoin(sc.analysis, eq(sc.analysis.id, sc.matches.id));
			
		return matches.map((match) => ({
			id: match.id,
			title: match.title,
			author: match.author,
			timeControl: match.timeControl,
			status: match.status,
			whitePlayer: match.whitePlayer,
			blackPlayer: match.blackPlayer,
			whitePlayerTime: match.whitePlayerTime,
			blackPlayerTime: match.blackPlayerTime,
			fen: match.fen || '',
			viewerCount: 0,
			newestMoveAt: match.newestMoveAt?.getTime(),
		})); 
	}
}

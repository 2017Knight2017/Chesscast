import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as sc from '../schema';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import { eq, and } from 'drizzle-orm';
import { RedisService } from 'src/redis/redis.service';

export interface MoveTreeNode {
	m: string;
	s?: MoveTreeNode[];
}

@Injectable()
export class UserAnalysisService {
	constructor(
		@Inject(DrizzleAsyncProvider) private db: NodePgDatabase<typeof sc>,
		@Inject(RedisService) private redisService: RedisService,
	) {}

	async getUserAnalysis(
		matchId: string,
		userId: number,
	): Promise<MoveTreeNode[] | null> {
		const redisData = await this.redisService.getUserAnalysis(matchId, userId);
		if (redisData) {
			return redisData as MoveTreeNode[];
		}

		const dbRecord = await this.db.query.userAnalysis.findFirst({
			where: and(
				eq(sc.userAnalysis.matchId, matchId as any),
				eq(sc.userAnalysis.userId, userId),
			),
		});

		if (!dbRecord) {
			return null;
		}

		return dbRecord.data as MoveTreeNode[];
	}

	async saveUserAnalysis(
		matchId: string,
		userId: number,
		data: MoveTreeNode[],
	): Promise<void> {
		const existingRecord = await this.db.query.userAnalysis.findFirst({
			where: and(
				eq(sc.userAnalysis.matchId, matchId as any),
				eq(sc.userAnalysis.userId, userId),
			),
		});

		if (existingRecord) {
			await this.db
				.update(sc.userAnalysis)
				.set({
					data: data as any,
					lastUpdated: new Date(),
				})
				.where(eq(sc.userAnalysis.id, existingRecord.id));
		} else {
			await this.db.insert(sc.userAnalysis).values({
				matchId: matchId as any,
				userId: userId,
				data: data as any,
			});
		}

		await this.redisService.deleteUserAnalysis(matchId, userId);
	}

	async discardUserAnalysis(matchId: string, userId: number): Promise<void> {
		await this.redisService.deleteUserAnalysis(matchId, userId);
	}

	async isAnalyzing(matchId: string, userId: number): Promise<boolean> {
		const redisData = await this.redisService.getUserAnalysis(matchId, userId);
		if (redisData) return true;

		const dbRecord = await this.db.query.userAnalysis.findFirst({
			where: and(
				eq(sc.userAnalysis.matchId, matchId as any),
				eq(sc.userAnalysis.userId, userId),
			),
		});

		return !!dbRecord;
	}
}

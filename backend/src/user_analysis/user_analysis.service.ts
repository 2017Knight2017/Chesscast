import { Injectable, Inject, Logger } from '@nestjs/common';
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
	) {
		this.logger.log('constructor called');
	}

	private readonly logger = new Logger(UserAnalysisService.name);

	async getUserAnalysis(
		matchId: string,
		userId: number,
	): Promise<MoveTreeNode[] | null> {
		this.logger.log('getUserAnalysis called');
		const redisData = await this.redisService.getUserAnalysis(matchId, userId);
		this.logger.log(redisData);
		if (redisData) {
			return redisData as MoveTreeNode[];
		}

		const dbRecord = await this.db.query.userAnalysis.findFirst({
			where: and(
				eq(sc.userAnalysis.matchId, matchId),
				eq(sc.userAnalysis.userId, userId),
			),
		});
		
		if (!dbRecord) {
			return null;
		}
		this.logger.log(dbRecord.data);

		return dbRecord.data as MoveTreeNode[];
	}

	async saveUserAnalysis(
		matchId: string,
		userId: number,
		data: MoveTreeNode[],
	): Promise<void> {
		this.logger.log('saveUserAnalysis called');
		const existingRecord = await this.db.query.userAnalysis.findFirst({
			where: and(
				eq(sc.userAnalysis.matchId, matchId),
				eq(sc.userAnalysis.userId, userId),
			),
		});

		if (existingRecord) {
			this.logger.log("There is already a record! Updating...");
			await this.db
				.update(sc.userAnalysis)
				.set({
					data: data,
					lastUpdated: new Date(),
				})
				.where(eq(sc.userAnalysis.id, existingRecord.id));
		} else {
			this.logger.log("There is no existing record! Saving...");
			await this.db
			.insert(sc.userAnalysis)
			.values({
				matchId: matchId,
				userId: userId,
				data: data,
			});
		}

		await this.redisService.deleteUserAnalysis(matchId, userId);
	}

	async saveAnalysisFromRedis(matchId: string, userId: number): Promise<void> {
		this.logger.log('saveAnalysisFromRedis called');
		const redisData = await this.redisService.getUserAnalysis(matchId, userId);
		if (redisData) {
			await this.saveUserAnalysis(matchId, userId, redisData as MoveTreeNode[]);
		}
	}

	async discardUserAnalysis(matchId: string, userId: number): Promise<void> {
		this.logger.log('discardUserAnalysis called');
		try {
			await this.db
				.delete(sc.userAnalysis)
				.where(
					and(
						eq(sc.userAnalysis.matchId, matchId),
						eq(sc.userAnalysis.userId, userId),
					)
				);
			await this.redisService.deleteUserAnalysis(matchId, userId);
		} catch (error) {
			this.logger.error(`Failed to discard analysis for user ${userId}: ${error.message}`);
			throw error;
		}
	}

	async isAnalyzing(matchId: string, userId: number): Promise<boolean> {
		this.logger.log('isAnalyzing called');
		const redisData = await this.redisService.getUserAnalysis(matchId, userId);
		if (redisData) return true;

		const dbRecord = await this.db.query.userAnalysis.findFirst({
			where: and(
				eq(sc.userAnalysis.matchId, matchId),
				eq(sc.userAnalysis.userId, userId),
			),
		});

		return !!dbRecord;
	}

	async findByUsername(username: string) {
		this.logger.log('findByUsername called');
		const result = await this.db
			.select({
				id: sc.users.id,
				username: sc.users.username,
			})
			.from(sc.users)
			.where(eq(sc.users.username, username))
			.limit(1)
			.execute();

		if (!result || result.length === 0) return null;
		return { userId: result[0].id, username: result[0].username };
	}
}

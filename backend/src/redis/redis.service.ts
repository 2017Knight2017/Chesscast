import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
	private readonly redis: Redis;

	constructor() {
		this.redis = new Redis({
			host: process.env.REDIS_HOST || 'localhost',
			port: 6379,
		});
	}

	async addViewer(matchId: string) {
		await this.redis.incr(`match:${matchId}:viewers`);
	}

	async removeViewer(matchId: string) {
		const count = await this.redis.decr(`match:${matchId}:viewers`);
		if (count < 0) await this.redis.set(`match:${matchId}:viewers`, 0);
	}

	async getViewerCount(matchId: string): Promise<number> {
		const count = await this.redis.get(`match:${matchId}:viewers`);
		return parseInt(count || '0', 10);
	}
}
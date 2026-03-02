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

	async addViewer(matchId: string, username: string) {
		const key = `match:${matchId}:viewers_list`;
		await this.redis.sadd(key, username);
	}

	async addGuestViewer(matchId: string) {
		const key = `match:${matchId}:guest_viewers_list`;
		await this.redis.incr(key);
	}

	async removeGuestViewer(matchId: string) {
		const key = `match:${matchId}:guest_viewers_list`;
		await this.redis.decr(key);
	}

	async removeViewer(matchId: string, username: string) {
		const key = `match:${matchId}:viewers_list`;
		await this.redis.srem(key, username);
	}

	async getViewerData(matchId: string) {
		const authorizedKey = `match:${matchId}:viewers_list`;
		const guestKey = `match:${matchId}:guest_viewers_list`;
		const [count, usernames, guestCount] = await Promise.all([
			this.redis.scard(authorizedKey),		
			this.redis.smembers(authorizedKey),
			this.redis.get(guestKey)
		]);
		return { count, usernames, guestCount: parseInt(guestCount || '0') };
	}
}
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

  async addGuestViewer(matchId: string, guestId: string) {
    const key = `match:${matchId}:guest_viewers_list`;
    await this.redis.sadd(key, guestId);
  }

  async removeGuestViewer(matchId: string, guestId: string) {
    const key = `match:${matchId}:guest_viewers_list`;
    await this.redis.srem(key, guestId);
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
			this.redis.scard(guestKey)
    ]);
    return { count, usernames, guestCount };
  }

  async setUserAnalysis(
    matchId: string,
    userId: number,
    data: object,
    ttlSeconds: number = 7200,
  ) {
    const key = `analysis_cache:match:${matchId}:user:${userId}`;
    await this.redis.setex(key, ttlSeconds, JSON.stringify(data));
  }

  async getUserAnalysis(
    matchId: string,
    userId: number,
  ): Promise<object | null> {
    const key = `analysis_cache:match:${matchId}:user:${userId}`;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async deleteUserAnalysis(matchId: string, userId: number) {
    const key = `analysis_cache:match:${matchId}:user:${userId}`;
    await this.redis.del(key);
  }
}

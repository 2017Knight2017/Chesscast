import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private readonly redis: Redis;

  constructor() {
    console.log('[RedisService] constructor called');
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: 6379,
    });
  }

  async addViewer(matchId: string, username: string) {
    console.log('[RedisService] addViewer called');
    const key = `match:${matchId}:viewers_list`;
    await this.redis.sadd(key, username);
  }

  async addGuestViewer(matchId: string, guestId: string) {
    console.log('[RedisService] addGuestViewer called');
    const key = `match:${matchId}:guest_viewers_list`;
    await this.redis.sadd(key, guestId);
  }

  async removeGuestViewer(matchId: string, guestId: string) {
    console.log('[RedisService] removeGuestViewer called');
    const key = `match:${matchId}:guest_viewers_list`;
    await this.redis.srem(key, guestId);
  }

  async removeViewer(matchId: string, username: string) {
    console.log('[RedisService] removeViewer called');
    const key = `match:${matchId}:viewers_list`;
    await this.redis.srem(key, username);
  }

  async getViewerData(matchId: string) {
    console.log('[RedisService] getViewerData called');
    const authorizedKey = `match:${matchId}:viewers_list`;
    const guestKey = `match:${matchId}:guest_viewers_list`;
    const statusKey = `match:${matchId}:user_statuses`;

    const [count, usernames, guestCount, statuses] = await Promise.all([
      this.redis.scard(authorizedKey),
      this.redis.smembers(authorizedKey),
      this.redis.scard(guestKey),
      this.redis.hgetall(statusKey),
    ]);

    const formattedUsernames = usernames.map((username) => {
      const statusStr = statuses[username];
      const status = statusStr ? JSON.parse(statusStr) : { isAnalyzing: false };
      return { username, ...status };
    });

    return { count, usernames: formattedUsernames, guestCount };
  }

  async setUserStatus(matchId: string, username: string, status: object) {
    console.log('[RedisService] setUserStatus called');
    const statusKey = `match:${matchId}:user_statuses`;
    await this.redis.hset(statusKey, username, JSON.stringify(status));
  }

  async removeUserStatus(matchId: string, username: string) {
    console.log('[RedisService] removeUserStatus called');
    const statusKey = `match:${matchId}:user_statuses`;
    await this.redis.hdel(statusKey, username);
  }

  async setUserAnalysis(
    matchId: string,
    userId: number,
    data: object,
    ttlSeconds: number = 7200,
  ) {
    console.log('[RedisService] setUserAnalysis called');
    const key = `analysis_cache:match:${matchId}:user:${userId}`;
    await this.redis.setex(key, ttlSeconds, JSON.stringify(data));
  }

  async getUserAnalysis(
    matchId: string,
    userId: number,
  ): Promise<object | null> {
    console.log('[RedisService] getUserAnalysis called');
    const key = `analysis_cache:match:${matchId}:user:${userId}`;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async deleteUserAnalysis(matchId: string, userId: number) {
    console.log('[RedisService] deleteUserAnalysis called');
    const key = `analysis_cache:match:${matchId}:user:${userId}`;
    await this.redis.del(key);
  }
}

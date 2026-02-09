import { Provider } from '@nestjs/common';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

export const redisProvider: Provider = {
  provide: REDIS_CLIENT,
  useFactory: () => {
    const client = new Redis({
      host: process.env.REDIS_HOST || 'localhost', // Важно: используй ENV переменные
      port: 6379,
    });

    client.on('error', (err) => {
      console.error('[redis] error', err);
    });

    client.on('connect', () => {
      console.log('[redis] connected');
    });

    return client;
  },
};
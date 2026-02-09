import Redis from 'ioredis';

// В Docker-compose имя хоста будет 'redis' (как имя сервиса)
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Prevent unhandled 'error' events from crashing the process
redis.on('error', (err) => {
	// Keep this console for server-side visibility; do not throw here
	console.error('[ioredis] error', err);
});

redis.on('connect', () => {
	console.log('[ioredis] connected');
});

export default redis;
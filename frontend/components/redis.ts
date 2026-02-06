import Redis from 'ioredis';

// В Docker-compose имя хоста будет 'redis' (как имя сервиса)
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export default redis;
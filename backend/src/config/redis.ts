import IORedis from 'ioredis';
import { env } from './env';

// Shared ioredis client — used ONLY for direct Redis operations
// BullMQ gets the URL string directly (avoids ioredis version conflict)
let redisClient: IORedis | null = null;

export function getRedisConnection(): IORedis {
  if (redisClient) return redisClient;

  if (!env.REDIS_URL) {
    throw new Error('REDIS_URL is not configured in .env');
  }

  redisClient = new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck:     false,
    lazyConnect:          false,
    tls: env.REDIS_URL.startsWith('rediss')
      ? { rejectUnauthorized: false }
      : undefined,
  });

  redisClient.on('connect',  () => console.log('Redis connected'));
  redisClient.on('error',    (err) => console.error('Redis error:', err.message));
  redisClient.on('close',    () => console.warn('Redis connection closed'));

  return redisClient;
}

// BullMQ connection options — pass URL string, not ioredis instance
export function getBullMQConnection() {
  if (!env.REDIS_URL) {
    throw new Error('REDIS_URL is not configured in .env');
  }

  const isTls = env.REDIS_URL.startsWith('rediss://');

  // Parse URL into host/port/password for BullMQ
  const url = new URL(env.REDIS_URL);

  return {
    host:     url.hostname,
    port:     parseInt(url.port || '6379', 10),
    password: url.password || undefined,
    username: url.username || undefined,
    tls:      isTls ? {} : undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck:     false,
  };
}

export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}
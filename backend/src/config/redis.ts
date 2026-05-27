import IORedis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

if (!process.env.REDIS_URL) {
  throw new Error('REDIS_URL is not set in .env');
}

export const redisConnection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,   // required for BullMQ
  enableReadyCheck: false,       // required for Upstash
  tls: { rejectUnauthorized: false },
});

redisConnection.on('connect', () => console.log('Redis connected'));
redisConnection.on('error', (err) => console.error('Redis error:', err.message));

export default redisConnection;

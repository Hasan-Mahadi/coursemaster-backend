// src/utils/cache.js
import { redisClient } from '../config/redisClient.js';

const DEFAULT_TTL = Number(process.env.REDIS_TTL || 60); // seconds

export const getCache = async (key) => {
  try {
    const data = await redisClient.get(key);
    if (!data) return null;
    return JSON.parse(data);
  } catch (err) {
    console.error('getCache error', err);
    return null;
  }
};

export const setCache = async (key, value, ttl = DEFAULT_TTL) => {
  try {
    await redisClient.set(key, JSON.stringify(value), { EX: ttl });
  } catch (err) {
    console.error('setCache error', err);
  }
};

// Delete a specific key
export const delCache = async (key) => {
  try {
    await redisClient.del(key);
  } catch (err) {
    console.error('delCache error', err);
  }
};

// Delete keys by pattern (uses scanIterator)
export const delCacheByPattern = async (pattern) => {
  try {
    // pattern example: 'courses:*' or 'quizzes:*'
    const it = redisClient.scanIterator({ MATCH: pattern, COUNT: 100 });
    for await (const key of it) {
      await redisClient.del(key);
    }
  } catch (err) {
    console.error('delCacheByPattern error', err);
  }
};

import Redis from "ioredis";
import { config } from "./index";
import { logger } from "../utils/logger";

type RedisClient = Redis | null;

const disabled = process.env.DISABLE_REDIS === "true" || !config.redis.url;

let client: RedisClient = disabled
  ? null
  : new Redis(config.redis.url, {
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      connectTimeout: 5_000,
      retryStrategy(times) {
        return times > 3 ? null : Math.min(times * 250, 1_000);
      },
    });

client?.on("error", (err) => {
  logger.warn("Redis unavailable; continuing without cache", { error: err.message });
});

async function withRedis<T>(operation: (redisClient: Redis) => Promise<T>, fallback: T): Promise<T> {
  if (!client) return fallback;

  try {
    if (client.status === "wait") await client.connect();
    return await operation(client);
  } catch (error) {
    logger.warn("Redis operation failed; using fallback", {
      error: error instanceof Error ? error.message : "Unknown Redis error",
    });
    return fallback;
  }
}

export const redis = {
  get(key: string) {
    return withRedis((redisClient) => redisClient.get(key), null);
  },

  setex(key: string, seconds: number, value: string) {
    return withRedis((redisClient) => redisClient.setex(key, seconds, value), "OK");
  },

  del(...keys: string[]) {
    if (!keys.length) return Promise.resolve(0);
    return withRedis((redisClient) => redisClient.del(...keys), 0);
  },

  ping() {
    return withRedis((redisClient) => redisClient.ping(), null);
  },

  keys(pattern: string) {
    return withRedis((redisClient) => redisClient.keys(pattern), [] as string[]);
  },

  disconnect() {
    client?.disconnect();
    client = null;
  },
};

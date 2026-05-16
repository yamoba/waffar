import Redis from "ioredis";
import { config } from "./index";

export const redis = new Redis(config.redis.url, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    return Math.min(times * 50, 2000);
  },
});

redis.on("error", (err) => {
  console.error("Redis connection error:", err.message);
});

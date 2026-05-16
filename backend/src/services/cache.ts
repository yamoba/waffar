import { redis } from "../config/redis";

export async function getJson<T>(key: string): Promise<T | null> {
  const cached = await redis.get(key);
  return cached ? JSON.parse(cached) as T : null;
}

export async function setJson(key: string, value: unknown, ttlSeconds: number) {
  await redis.setex(key, ttlSeconds, JSON.stringify(value));
}

export async function invalidateByPrefix(prefix: string) {
  const stream = redis.scanStream({ match: `${prefix}*`, count: 100 });
  const keys: string[] = [];
  for await (const batch of stream) keys.push(...batch as string[]);
  if (keys.length) await redis.del(...keys);
}

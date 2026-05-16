import { Queue } from "bullmq";
import { config } from "../config";

const connection = { url: config.redis.url };

let scrapeQueue: Queue | undefined;
let maintenanceQueue: Queue | undefined;
let notificationQueue: Queue | undefined;

export function getScrapeQueue() {
  scrapeQueue ??= new Queue("scrape", { connection });
  return scrapeQueue;
}

export function getMaintenanceQueue() {
  maintenanceQueue ??= new Queue("maintenance", { connection });
  return maintenanceQueue;
}

export function getNotificationQueue() {
  notificationQueue ??= new Queue("notifications", { connection });
  return notificationQueue;
}

export async function enqueueScrape(storeId: string, options: { sourceUrl?: string; force?: boolean } = {}) {
  return getScrapeQueue().add(
    "scrape-store",
    { storeId, ...options },
    {
      jobId: `scrape:${storeId}:${options.sourceUrl || "default"}`,
      attempts: 3,
      backoff: { type: "exponential", delay: 30_000 },
      removeOnComplete: 100,
      removeOnFail: 500,
    }
  );
}

export async function enqueueMaintenance(name: string, payload: Record<string, unknown> = {}) {
  return getMaintenanceQueue().add(name, payload, {
    jobId: `${name}:${new Date().toISOString().slice(0, 10)}`,
    attempts: 2,
    removeOnComplete: 50,
    removeOnFail: 200,
  });
}

import { Job, Worker } from "bullmq";
import { config } from "../config";
import { prisma } from "../config/prisma";
import { logger } from "../utils/logger";
import { checkAlerts } from "./alert-checker";
import { updateProductAggregates } from "./price-updater";

const connection = { url: config.redis.url };

type ScrapeJobData = {
  storeId: string;
  sourceUrl?: string;
  force?: boolean;
};

async function processScrape(job: Job<ScrapeJobData>) {
  const { storeId, sourceUrl } = job.data;
  const startedAt = new Date();
  const run = await prisma.scraperRun.create({
    data: {
      storeId,
      status: "RUNNING",
      startedAt,
    },
  });

  try {
    const store = await prisma.store.findUniqueOrThrow({ where: { id: storeId } });
    const configRecord = await prisma.scraperConfig.findFirst({ where: { storeId } });

    if (!configRecord?.isActive && !job.data.force) {
      await prisma.scraperRun.update({
        where: { id: run.id },
        data: {
          status: "PARTIAL",
          completedAt: new Date(),
          errorLog: "Scraper skipped because config is inactive",
        },
      });
      return { skipped: true };
    }

    // The Python scraper service owns browser scraping. This worker records the
    // orchestration contract and keeps admin/API actions retry-safe in Node.
    await prisma.scraperRun.update({
      where: { id: run.id },
      data: {
        status: "SUCCESS",
        completedAt: new Date(),
        duration: Date.now() - startedAt.getTime(),
        productsFound: 0,
        pricesUpdated: 0,
        errorLog: `Scrape orchestration completed for ${store.slug}. Source: ${sourceUrl || configRecord?.categoryUrl || "default"}`,
      },
    });

    return { storeId, store: store.slug };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown scraper error";
    await prisma.scrapeError.create({
      data: {
        runId: run.id,
        storeId,
        sourceUrl,
        stage: "WORKER_ERROR",
        message,
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
    await prisma.scraperRun.update({
      where: { id: run.id },
      data: { status: "FAILED", completedAt: new Date(), duration: Date.now() - startedAt.getTime(), errorLog: message, errors: 1 },
    });
    throw error;
  }
}

async function processMaintenance(job: Job<Record<string, unknown>>) {
  if (job.name === "check-alerts") return checkAlerts();
  if (job.name === "update-product-aggregates") return updateProductAggregates();
  if (job.name === "daily-price-snapshot") {
    await updateProductAggregates();
    return checkAlerts();
  }
  logger.warn(`Unknown maintenance job: ${job.name}`, { jobId: job.id });
  return { skipped: true };
}

const scrapeWorker = new Worker<ScrapeJobData>("scrape", processScrape, {
  connection,
  concurrency: config.scraper.concurrency,
});

const maintenanceWorker = new Worker<Record<string, unknown>>("maintenance", processMaintenance, {
  connection,
  concurrency: 2,
});

for (const worker of [scrapeWorker, maintenanceWorker]) {
  worker.on("completed", (job) => logger.info(`Worker job completed: ${job.queueName}/${job.name}`, { jobId: job.id }));
  worker.on("failed", (job, error) => logger.error(`Worker job failed: ${job?.queueName}/${job?.name}`, { jobId: job?.id, error }));
}

logger.info("Waffar background workers started");

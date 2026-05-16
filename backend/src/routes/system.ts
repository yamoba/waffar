import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { redis } from "../config/redis";
import { authenticate, requireRole } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { requireInternalApiKey } from "../middleware/internal-api-key";
import { enqueueMaintenance, enqueueScrape } from "../services/queues";
import { config } from "../config";

export const systemRouter = Router();

systemRouter.get("/health", async (_req: Request, res: Response) => {
  const dbOk = await prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false);
  const redisOk = await redis.ping().then(() => true).catch(() => false);
  res.json({ status: dbOk && redisOk ? "healthy" : "degraded", db: dbOk, redis: redisOk, timestamp: new Date().toISOString() });
});

systemRouter.get("/ready", async (_req: Request, res: Response) => {
  const dbOk = await prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false);
  res.status(dbOk ? 200 : 503).json({ ready: dbOk });
});

systemRouter.get("/metrics", authenticate, requireRole("ADMIN", "SUPER_ADMIN"), async (_req: Request, res: Response) => {
  const [users, products, stores, alerts, failedScrapes] = await Promise.all([
    prisma.user.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.store.count({ where: { isActive: true } }),
    prisma.alert.count({ where: { isActive: true } }),
    prisma.scraperRun.count({ where: { status: "FAILED", startedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
  ]);
  res.json({ users, products, stores, alerts, failedScrapes, features: config.features });
});

systemRouter.post("/jobs/scrape", requireInternalApiKey, validate(z.object({ storeId: z.string().uuid(), sourceUrl: z.string().url().optional(), force: z.boolean().optional() })), async (req: Request, res: Response) => {
  const job = await enqueueScrape(req.body.storeId, { sourceUrl: req.body.sourceUrl, force: req.body.force });
  res.status(202).json({ jobId: job.id, queued: true });
});

systemRouter.post("/jobs/maintenance", requireInternalApiKey, validate(z.object({ name: z.string().min(2), payload: z.record(z.unknown()).default({}) })), async (req: Request, res: Response) => {
  const job = await enqueueMaintenance(req.body.name, req.body.payload);
  res.status(202).json({ jobId: job.id, queued: true });
});

import { Router, Request, Response } from "express";
import { prisma } from "../config/prisma";
import { authenticate, requireRole } from "../middleware/auth";
import { enqueueScrape } from "../services/queues";

export const adminRouter = Router();
adminRouter.use(authenticate, requireRole("ADMIN", "SUPER_ADMIN"));

// ─── Scraper Control ─────────────────────────────────

adminRouter.get("/scrapers", async (_req: Request, res: Response) => {
  const configs = await prisma.scraperConfig.findMany({
    include: { store: { select: { name: true, slug: true } } },
    orderBy: { updatedAt: "desc" },
  });
  res.json(configs);
});

adminRouter.get("/scrapers/runs", async (req: Request, res: Response) => {
  const { storeId, status, page = "1" } = req.query;
  const where: any = {};
  if (storeId) where.storeId = storeId;
  if (status) where.status = status;

  const skip = (parseInt(page as string) - 1) * 20;
  const [runs, total] = await Promise.all([
    prisma.scraperRun.findMany({
      where,
      orderBy: { startedAt: "desc" },
      skip,
      take: 20,
      include: { store: { select: { name: true, slug: true } } },
    }),
    prisma.scraperRun.count({ where }),
  ]);

  res.json({ runs, pagination: { page: parseInt(page as string), total, pages: Math.ceil(total / 20) } });
});

adminRouter.patch("/scrapers/:id", async (req: Request, res: Response) => {
  const { isActive, selectors, frequency } = req.body;
  const config = await prisma.scraperConfig.update({
    where: { id: req.params.id },
    data: {
      ...(isActive !== undefined && { isActive }),
      ...(selectors && { selectors }),
      ...(frequency && { frequency }),
    },
  });
  res.json(config);
});

adminRouter.post("/scrapers/:id/start", async (req: Request, res: Response) => {
  const config = await prisma.scraperConfig.findUniqueOrThrow({ where: { id: req.params.id } });
  const job = await enqueueScrape(config.storeId, { sourceUrl: req.body?.sourceUrl, force: true });
  await prisma.auditLog.create({
    data: { userId: req.user!.id, action: "SCRAPER_START", entity: "ScraperConfig", entityId: config.id, details: { jobId: job.id } },
  });
  res.status(202).json({ queued: true, jobId: job.id });
});

adminRouter.post("/scrapers/:id/pause", async (req: Request, res: Response) => {
  const config = await prisma.scraperConfig.update({ where: { id: req.params.id }, data: { isActive: false } });
  await prisma.auditLog.create({
    data: { userId: req.user!.id, action: "SCRAPER_PAUSE", entity: "ScraperConfig", entityId: config.id, details: {} },
  });
  res.json(config);
});

adminRouter.post("/scrapers/:id/resume", async (req: Request, res: Response) => {
  const config = await prisma.scraperConfig.update({ where: { id: req.params.id }, data: { isActive: true } });
  const job = await enqueueScrape(config.storeId, { force: false });
  await prisma.auditLog.create({
    data: { userId: req.user!.id, action: "SCRAPER_RESUME", entity: "ScraperConfig", entityId: config.id, details: { jobId: job.id } },
  });
  res.status(202).json({ config, queued: true, jobId: job.id });
});

adminRouter.post("/scrapers/runs/:id/retry", async (req: Request, res: Response) => {
  const run = await prisma.scraperRun.findUniqueOrThrow({ where: { id: req.params.id } });
  const job = await enqueueScrape(run.storeId, { force: true });
  await prisma.auditLog.create({
    data: { userId: req.user!.id, action: "SCRAPER_RETRY", entity: "ScraperRun", entityId: run.id, details: { jobId: job.id } },
  });
  res.status(202).json({ queued: true, jobId: job.id });
});

adminRouter.get("/scrapers/runs/:id/errors", async (req: Request, res: Response) => {
  const errors = await prisma.scrapeError.findMany({
    where: { runId: req.params.id },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  res.json({ errors });
});

// ─── Product Control ─────────────────────────────────

adminRouter.get("/products", async (req: Request, res: Response) => {
  const { page = "1", q } = req.query;
  const where: any = {};
  if (q) where.title = { contains: q as string, mode: "insensitive" };

  const skip = (parseInt(page as string) - 1) * 20;
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: 20,
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { listings: true } } },
    }),
    prisma.product.count({ where }),
  ]);

  res.json({ products, pagination: { page: parseInt(page as string), total, pages: Math.ceil(total / 20) } });
});

adminRouter.post("/products/merge", async (req: Request, res: Response) => {
  const { keepId, mergeId } = req.body;
  if (!keepId || !mergeId) return res.status(400).json({ error: "keepId and mergeId required" });

  await prisma.$transaction([
    prisma.listing.updateMany({ where: { productId: mergeId }, data: { productId: keepId } }),
    prisma.priceHistory.updateMany({ where: { productId: mergeId }, data: { productId: keepId } }),
    prisma.alert.updateMany({ where: { productId: mergeId }, data: { productId: keepId } }),
    prisma.watchlistItem.updateMany({ where: { productId: mergeId }, data: { productId: keepId } }),
    prisma.product.delete({ where: { id: mergeId } }),
  ]);

  await prisma.auditLog.create({
    data: { userId: req.user!.id, action: "PRODUCT_MERGE", entity: "Product", entityId: keepId, details: { mergeId } },
  });

  res.json({ merged: true });
});

adminRouter.patch("/products/:id", async (req: Request, res: Response) => {
  const { title, titleAr, brand, model, category, matchConfidence } = req.body;
  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: {
      ...(title && { title }),
      ...(titleAr && { titleAr }),
      ...(brand && { brand }),
      ...(model && { model }),
      ...(category && { category }),
      ...(matchConfidence !== undefined && { matchConfidence }),
    },
  });
  res.json(product);
});

// ─── Store Control ───────────────────────────────────

adminRouter.patch("/stores/:id", async (req: Request, res: Response) => {
  const { isActive } = req.body;
  const store = await prisma.store.update({
    where: { id: req.params.id },
    data: { isActive },
  });
  res.json(store);
});

// ─── Analytics ───────────────────────────────────────

adminRouter.get("/analytics", async (_req: Request, res: Response) => {
  const [totalProducts, totalListings, totalUsers, totalAlerts, recentSearches, scraperHealth] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.listing.count({ where: { isActive: true } }),
    prisma.user.count(),
    prisma.alert.count({ where: { isActive: true } }),
    prisma.searchLog.count({ where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
    prisma.scraperRun.groupBy({
      by: ["status"],
      where: { startedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      _count: { id: true },
    }),
  ]);

  res.json({
    totalProducts,
    totalListings,
    totalUsers,
    totalAlerts,
    recentSearches,
    scraperHealth: Object.fromEntries(scraperHealth.map((s) => [s.status, s._count.id])),
  });
});

// ─── Scraper Health & Listing Verification ──────────

adminRouter.get("/scraper-health", async (_req: Request, res: Response) => {
  const now = Date.now();
  const dayAgo = new Date(now - 24 * 60 * 60 * 1000);
  const hour12Ago = new Date(now - 12 * 60 * 60 * 1000);

  const [perStore, statusCounts, recentRuns, deadCount, suspiciousCount] = await Promise.all([
    prisma.$queryRaw<
      Array<{
        store_id: string;
        store_name: string;
        store_slug: string;
        total_listings: bigint;
        verified: bigint;
        suspicious: bigint;
        dead: bigint;
        stale_listings: bigint;
        avg_minutes_since_verify: number | null;
      }>
    >`
      SELECT
        s.id AS store_id,
        s.name AS store_name,
        s.slug AS store_slug,
        COUNT(l.id) AS total_listings,
        COUNT(*) FILTER (WHERE l.verification_status = 'VERIFIED') AS verified,
        COUNT(*) FILTER (WHERE l.verification_status = 'SUSPICIOUS') AS suspicious,
        COUNT(*) FILTER (WHERE l.verification_status = 'DEAD') AS dead,
        COUNT(*) FILTER (WHERE l.last_verified_at IS NULL OR l.last_verified_at < ${hour12Ago}) AS stale_listings,
        AVG(EXTRACT(EPOCH FROM (NOW() - l.last_verified_at)) / 60) AS avg_minutes_since_verify
      FROM "Store" s
      LEFT JOIN "Listing" l ON l.store_id = s.id AND l.is_active = true
      WHERE s.is_active = true
      GROUP BY s.id, s.name, s.slug
      ORDER BY s.name ASC
    `,
    prisma.listing.groupBy({
      by: ["verificationStatus"],
      where: { isActive: true },
      _count: { id: true },
    }),
    prisma.scraperRun.groupBy({
      by: ["status"],
      where: { startedAt: { gte: dayAgo } },
      _count: { id: true },
    }),
    prisma.listing.count({ where: { verificationStatus: "DEAD" } }),
    prisma.listing.count({ where: { verificationStatus: "SUSPICIOUS", isActive: true } }),
  ]);

  res.json({
    perStore: perStore.map((r) => ({
      storeId: r.store_id,
      storeName: r.store_name,
      storeSlug: r.store_slug,
      totalListings: Number(r.total_listings),
      verified: Number(r.verified),
      suspicious: Number(r.suspicious),
      dead: Number(r.dead),
      staleListings: Number(r.stale_listings),
      avgMinutesSinceVerify: r.avg_minutes_since_verify ? Math.round(r.avg_minutes_since_verify) : null,
      verifiedRatio: Number(r.total_listings) > 0 ? Number(r.verified) / Number(r.total_listings) : null,
    })),
    statusBreakdown: Object.fromEntries(statusCounts.map((s) => [s.verificationStatus, s._count.id])),
    runs24h: Object.fromEntries(recentRuns.map((r) => [r.status, r._count.id])),
    totals: { deadListings: deadCount, suspiciousActiveListings: suspiciousCount },
  });
});

adminRouter.get("/listings/dead", async (req: Request, res: Response) => {
  const { page = "1" } = req.query;
  const skip = (parseInt(page as string) - 1) * 50;
  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where: { verificationStatus: "DEAD" },
      orderBy: { lastFailedAt: "desc" },
      skip,
      take: 50,
      include: {
        store: { select: { name: true, slug: true } },
        product: { select: { title: true, slug: true } },
      },
    }),
    prisma.listing.count({ where: { verificationStatus: "DEAD" } }),
  ]);
  res.json({ listings, pagination: { page: parseInt(page as string), total, pages: Math.ceil(total / 50) } });
});

adminRouter.post("/listings/:id/revive", async (req: Request, res: Response) => {
  const listing = await prisma.listing.update({
    where: { id: req.params.id },
    data: { isActive: true, verificationStatus: "UNVERIFIED", consecutiveFailures: 0 },
  });
  await prisma.auditLog.create({
    data: { userId: req.user!.id, action: "LISTING_REVIVE", entity: "Listing", entityId: listing.id, details: {} },
  });
  res.json(listing);
});

// ─── Audit Log ───────────────────────────────────────

adminRouter.get("/audit-log", async (req: Request, res: Response) => {
  const { page = "1" } = req.query;
  const skip = (parseInt(page as string) - 1) * 50;
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, skip, take: 50 }),
    prisma.auditLog.count(),
  ]);
  res.json({ logs, pagination: { page: parseInt(page as string), total, pages: Math.ceil(total / 50) } });
});

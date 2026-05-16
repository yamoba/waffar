import { Router, Request, Response } from "express";
import { z } from "zod";
import { v4 as uuid } from "uuid";
import { prisma } from "../config/prisma";
import { authenticate, optionalAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { AppError } from "../middleware/error";
import { config } from "../config";

export const commerceRouter = Router();

const comparisonSchema = z.object({
  productIds: z.array(z.string().uuid()).min(2).max(4),
  sessionId: z.string().optional(),
});

const reportSchema = z.object({
  productId: z.string().uuid().optional(),
  storeId: z.string().uuid().optional(),
  type: z.string().min(2).max(60),
  message: z.string().min(5).max(1000),
  metadata: z.record(z.unknown()).optional(),
});

commerceRouter.post("/comparisons", optionalAuth, validate(comparisonSchema), async (req: Request, res: Response) => {
  const groupId = uuid();
  await prisma.comparisonLog.createMany({
    data: req.body.productIds.map((productId: string) => ({
      groupId,
      productId,
      userId: req.user?.id,
      sessionId: req.body.sessionId,
    })),
  });
  const products = await prisma.product.findMany({
    where: { id: { in: req.body.productIds } },
    include: { listings: { where: { isActive: true }, orderBy: { price: "asc" }, include: { store: true }, take: 3 } },
  });
  res.status(201).json({ groupId, products });
});

commerceRouter.get("/comparisons", authenticate, async (req: Request, res: Response) => {
  const groups = await prisma.comparisonLog.groupBy({
    by: ["groupId"],
    where: { userId: req.user!.id },
    _max: { createdAt: true },
    _count: { productId: true },
    orderBy: { _max: { createdAt: "desc" } },
    take: 20,
  });
  res.json({ comparisons: groups });
});

commerceRouter.post("/reports", optionalAuth, validate(reportSchema), async (req: Request, res: Response) => {
  if (!req.body.productId && !req.body.storeId) throw new AppError(400, "productId or storeId is required");
  const report = await prisma.report.create({
    data: { ...req.body, userId: req.user?.id },
  });
  res.status(201).json(report);
});

commerceRouter.get("/reports", authenticate, async (req: Request, res: Response) => {
  const reports = await prisma.report.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  res.json({ reports });
});

commerceRouter.get("/redirect", optionalAuth, async (req: Request, res: Response) => {
  if (!config.features.affiliateTracking) throw new AppError(403, "Affiliate tracking is disabled");
  const { productId, storeId, url, campaign = "waffar-eg" } = req.query;
  if (!url || typeof url !== "string") throw new AppError(400, "url is required");
  const target = new URL(url);
  target.searchParams.set("utm_source", "waffar.eg");
  target.searchParams.set("utm_medium", "price_comparison");
  target.searchParams.set("utm_campaign", String(campaign));
  const click = await prisma.affiliateClick.create({
    data: {
      userId: req.user?.id,
      productId: typeof productId === "string" ? productId : undefined,
      storeId: typeof storeId === "string" ? storeId : undefined,
      targetUrl: url,
      redirectUrl: target.toString(),
      utmSource: "waffar.eg",
      utmCampaign: String(campaign),
      ip: req.ip,
      userAgent: req.header("user-agent"),
    },
  });
  res.redirect(302, `${target.toString()}&click_id=${click.id}`);
});

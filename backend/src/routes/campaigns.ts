import { Router, Request, Response } from "express";
import { prisma } from "../config/prisma";
import { redis } from "../config/redis";

export const campaignRouter = Router();

campaignRouter.get("/", async (_req: Request, res: Response) => {
  const cached = await redis.get("active_campaigns");
  if (cached) return res.json(JSON.parse(cached));

  const campaigns = await prisma.campaign.findMany({
    where: { isActive: true, startsAt: { lte: new Date() }, endsAt: { gte: new Date() } },
    orderBy: { startsAt: "desc" },
  });

  await redis.setex("active_campaigns", 600, JSON.stringify(campaigns));
  res.json(campaigns);
});

campaignRouter.get("/:slug", async (req: Request, res: Response) => {
  const campaign = await prisma.campaign.findUnique({ where: { slug: req.params.slug } });
  if (!campaign) return res.status(404).json({ error: "Campaign not found" });
  res.json(campaign);
});

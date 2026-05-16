import { Router, Request, Response } from "express";
import { prisma } from "../config/prisma";
import { redis } from "../config/redis";

export const storeRouter = Router();

storeRouter.get("/", async (_req: Request, res: Response) => {
  const cached = await redis.get("stores_list");
  if (cached) return res.json(JSON.parse(cached));

  const stores = await prisma.store.findMany({
    where: { isActive: true },
    orderBy: { rating: "desc" },
    include: { _count: { select: { listings: true, coupons: { where: { isActive: true } } } } },
  });

  await redis.setex("stores_list", 3600, JSON.stringify(stores));
  res.json(stores);
});

storeRouter.get("/:slug", async (req: Request, res: Response) => {
  const store = await prisma.store.findUnique({
    where: { slug: req.params.slug },
    include: {
      coupons: { where: { isActive: true }, orderBy: { createdAt: "desc" } },
      branches: true,
      _count: { select: { listings: true } },
    },
  });
  if (!store) return res.status(404).json({ error: "Store not found" });
  res.json(store);
});

storeRouter.get("/:slug/products", async (req: Request, res: Response) => {
  const { page = "1", limit = "20", sort } = req.query;
  const store = await prisma.store.findUnique({ where: { slug: req.params.slug } });
  if (!store) return res.status(404).json({ error: "Store not found" });

  const orderBy: any = sort === "price_asc" ? { price: "asc" } : sort === "price_desc" ? { price: "desc" } : { updatedAt: "desc" };
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const take = Math.min(parseInt(limit as string), 50);

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where: { storeId: store.id, isActive: true },
      orderBy,
      skip,
      take,
      include: { product: { select: { title: true, slug: true, imageUrl: true, category: true } } },
    }),
    prisma.listing.count({ where: { storeId: store.id, isActive: true } }),
  ]);

  res.json({ listings, pagination: { page: parseInt(page as string), limit: take, total, pages: Math.ceil(total / take) } });
});

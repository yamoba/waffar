import { Router, Request, Response } from "express";
import { prisma } from "../config/prisma";
import { redis } from "../config/redis";
import { optionalAuth } from "../middleware/auth";
import { normalizeQuery, detectLanguage, transliterate } from "../services/search";

export const searchRouter = Router();

searchRouter.get("/", optionalAuth, async (req: Request, res: Response) => {
  const { q, category, brand, minPrice, maxPrice, sort, page = "1", limit = "20" } = req.query;
  if (!q || typeof q !== "string") return res.status(400).json({ error: "Query required" });

  const normalized = normalizeQuery(q);
  const language = detectLanguage(q);
  const transliterated = transliterate(q);

  const where: any = {
    isActive: true,
    OR: [
      { title: { contains: normalized, mode: "insensitive" } },
      { titleAr: { contains: normalized } },
      { brand: { contains: normalized, mode: "insensitive" } },
      { model: { contains: normalized, mode: "insensitive" } },
    ],
  };

  if (transliterated && transliterated !== normalized) {
    where.OR.push(
      { title: { contains: transliterated, mode: "insensitive" } },
      { titleAr: { contains: transliterated } }
    );
  }

  if (category) where.category = category;
  if (brand) where.brand = brand;
  if (minPrice || maxPrice) {
    where.lowestPrice = {};
    if (minPrice) where.lowestPrice.gte = parseInt(minPrice as string) * 100;
    if (maxPrice) where.lowestPrice.lte = parseInt(maxPrice as string) * 100;
  }

  const orderBy: any = {};
  switch (sort) {
    case "price_asc": orderBy.lowestPrice = "asc"; break;
    case "price_desc": orderBy.lowestPrice = "desc"; break;
    case "popular": orderBy.viewCount = "desc"; break;
    case "newest": orderBy.createdAt = "desc"; break;
    default: orderBy.clickCount = "desc";
  }

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const take = Math.min(parseInt(limit as string), 50);

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        listings: {
          where: { isActive: true },
          orderBy: { price: "asc" },
          take: 3,
          include: { store: { select: { name: true, slug: true, logoUrl: true } } },
        },
      },
    }),
    prisma.product.count({ where }),
  ]);

  // Log search
  prisma.searchLog.create({
    data: {
      userId: req.user?.id,
      query: q,
      normalized,
      language,
      resultCount: total,
    },
  }).catch(() => {});

  // Aggregate filters
  const brands = await prisma.product.groupBy({
    by: ["brand"],
    where: { ...where, brand: { not: null } },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 20,
  });

  const categories = await prisma.product.groupBy({
    by: ["category"],
    where,
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });

  res.json({
    products,
    filters: {
      brands: brands.map((b) => ({ name: b.brand, count: b._count.id })),
      categories: categories.map((c) => ({ name: c.category, count: c._count.id })),
    },
    pagination: { page: parseInt(page as string), limit: take, total, pages: Math.ceil(total / take) },
    meta: { normalized, language, transliterated },
  });
});

searchRouter.get("/suggest", async (req: Request, res: Response) => {
  const { q } = req.query;
  if (!q || typeof q !== "string" || q.length < 2) return res.json([]);

  const cacheKey = `suggest:${q.toLowerCase().slice(0, 50)}`;
  const cached = await redis.get(cacheKey);
  if (cached) return res.json(JSON.parse(cached));

  const normalized = normalizeQuery(q);

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        { title: { contains: normalized, mode: "insensitive" } },
        { titleAr: { contains: normalized } },
        { brand: { contains: normalized, mode: "insensitive" } },
      ],
    },
    select: { title: true, slug: true, imageUrl: true, lowestPrice: true, category: true },
    orderBy: { viewCount: "desc" },
    take: 8,
  });

  const popularSearches = await prisma.searchLog.groupBy({
    by: ["normalized"],
    where: { normalized: { contains: normalized, mode: "insensitive" } },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 5,
  });

  const result = {
    products,
    queries: popularSearches.map((s) => ({ text: s.normalized, count: s._count.id })),
  };

  await redis.setex(cacheKey, 60, JSON.stringify(result));
  res.json(result);
});

searchRouter.get("/popular", async (_req: Request, res: Response) => {
  const cached = await redis.get("popular_searches");
  if (cached) return res.json(JSON.parse(cached));

  const popular = await prisma.searchLog.groupBy({
    by: ["normalized"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
    where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
  });

  const result = popular.map((s) => ({ query: s.normalized, count: s._count.id }));
  await redis.setex("popular_searches", 600, JSON.stringify(result));
  res.json(result);
});

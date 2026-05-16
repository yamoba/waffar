import { Router, Request, Response } from "express";
import { prisma } from "../config/prisma";
import { redis } from "../config/redis";
import { optionalAuth } from "../middleware/auth";

export const productRouter = Router();

productRouter.get("/", optionalAuth, async (req: Request, res: Response) => {
  const { category, brand, sort, page = "1", limit = "20", minPrice, maxPrice } = req.query;

  const where: any = { isActive: true };
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

  res.json({
    products,
    pagination: {
      page: parseInt(page as string),
      limit: take,
      total,
      pages: Math.ceil(total / take),
    },
  });
});

productRouter.get("/trending", async (_req: Request, res: Response) => {
  const cached = await redis.get("trending_products");
  if (cached) return res.json(JSON.parse(cached));

  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { viewCount: "desc" },
    take: 12,
    include: {
      listings: {
        where: { isActive: true },
        orderBy: { price: "asc" },
        take: 1,
        include: { store: { select: { name: true, slug: true } } },
      },
    },
  });

  await redis.setex("trending_products", 300, JSON.stringify(products));
  res.json(products);
});

productRouter.get("/biggest-drops", async (_req: Request, res: Response) => {
  const cached = await redis.get("biggest_drops");
  if (cached) return res.json(JSON.parse(cached));

  const drops = await prisma.$queryRaw`
    WITH latest_prices AS (
      SELECT DISTINCT ON (ph."productId")
        ph."productId",
        ph.price as current_price,
        ph."listingId"
      FROM "PriceHistory" ph
      ORDER BY ph."productId", ph.timestamp DESC
    ),
    previous_prices AS (
      SELECT DISTINCT ON (ph."productId")
        ph."productId",
        ph.price as previous_price
      FROM "PriceHistory" ph
      WHERE ph.timestamp < NOW() - INTERVAL '24 hours'
      ORDER BY ph."productId", ph.timestamp DESC
    )
    SELECT
      lp."productId",
      lp.current_price,
      pp.previous_price,
      ROUND(((pp.previous_price - lp.current_price)::DECIMAL / pp.previous_price) * 100, 1) as drop_percentage
    FROM latest_prices lp
    JOIN previous_prices pp ON lp."productId" = pp."productId"
    WHERE pp.previous_price > lp.current_price
    ORDER BY drop_percentage DESC
    LIMIT 12
  ` as any[];

  const productIds = drops.map((d: any) => d.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: {
      listings: {
        where: { isActive: true },
        orderBy: { price: "asc" },
        take: 1,
        include: { store: { select: { name: true, slug: true } } },
      },
    },
  });

  const result = products.map((p) => {
    const drop = drops.find((d: any) => d.productId === p.id);
    return { ...p, dropPercentage: drop?.drop_percentage, previousPrice: drop?.previous_price };
  });

  await redis.setex("biggest_drops", 300, JSON.stringify(result));
  res.json(result);
});

productRouter.get("/deal-of-day", async (_req: Request, res: Response) => {
  const cached = await redis.get("deal_of_day");
  if (cached) return res.json(JSON.parse(cached));

  const deal = await prisma.product.findFirst({
    where: {
      isActive: true,
      listings: { some: { salePrice: { not: null }, isActive: true } },
    },
    orderBy: { clickCount: "desc" },
    include: {
      listings: {
        where: { isActive: true, salePrice: { not: null } },
        orderBy: { salePrice: "asc" },
        take: 1,
        include: { store: { select: { name: true, slug: true, logoUrl: true } } },
      },
    },
  });

  const result = {
    product: deal,
    expiresAt: new Date(new Date().setHours(23, 59, 59, 999)).toISOString(),
  };

  await redis.setex("deal_of_day", 600, JSON.stringify(result));
  res.json(result);
});

productRouter.get("/categories", async (_req: Request, res: Response) => {
  const cached = await redis.get("categories");
  if (cached) return res.json(JSON.parse(cached));

  const categories = await prisma.product.groupBy({
    by: ["category"],
    where: { isActive: true },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });

  const result = categories.map((c) => ({
    name: c.category,
    count: c._count.id,
  }));

  await redis.setex("categories", 3600, JSON.stringify(result));
  res.json(result);
});

productRouter.get("/:slug", optionalAuth, async (req: Request, res: Response) => {
  const product = await prisma.product.findUnique({
    where: { slug: req.params.slug },
    include: {
      listings: {
        where: { isActive: true },
        orderBy: { price: "asc" },
        include: {
          store: true,
          priceHistory: {
            orderBy: { timestamp: "desc" },
            take: 90,
          },
        },
      },
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { user: { select: { name: true, avatarUrl: true } } },
      },
      relatedTo: {
        include: {
          toProduct: {
            include: {
              listings: { where: { isActive: true }, orderBy: { price: "asc" }, take: 1 },
            },
          },
        },
        take: 8,
      },
      guides: { include: { guide: { select: { title: true, slug: true, coverImage: true } } } },
    },
  });

  if (!product) return res.status(404).json({ error: "Product not found" });

  await prisma.product.update({
    where: { id: product.id },
    data: { viewCount: { increment: 1 } },
  });

  if (req.user) {
    await prisma.priceView.create({
      data: { userId: req.user.id, productId: product.id, source: req.query.source as string },
    });
  }

  res.json(product);
});

productRouter.get("/:slug/price-history", async (req: Request, res: Response) => {
  const { period = "30d" } = req.query;
  const product = await prisma.product.findUnique({ where: { slug: req.params.slug } });
  if (!product) return res.status(404).json({ error: "Product not found" });

  const days = period === "7d" ? 7 : period === "90d" ? 90 : period === "1y" ? 365 : 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const history = await prisma.priceHistory.findMany({
    where: { productId: product.id, timestamp: { gte: since } },
    orderBy: { timestamp: "asc" },
    include: {
      listing: { include: { store: { select: { name: true, slug: true } } } },
    },
  });

  res.json(history);
});

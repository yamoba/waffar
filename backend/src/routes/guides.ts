import { Router, Request, Response } from "express";
import { prisma } from "../config/prisma";

export const guideRouter = Router();

guideRouter.get("/", async (req: Request, res: Response) => {
  const { category, page = "1" } = req.query;
  const where: any = { isPublished: true };
  if (category) where.category = category;

  const skip = (parseInt(page as string) - 1) * 12;
  const [guides, total] = await Promise.all([
    prisma.guide.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: 12,
      select: { id: true, title: true, titleAr: true, slug: true, category: true, coverImage: true, viewCount: true, createdAt: true },
    }),
    prisma.guide.count({ where }),
  ]);

  res.json({ guides, pagination: { page: parseInt(page as string), total, pages: Math.ceil(total / 12) } });
});

guideRouter.get("/:slug", async (req: Request, res: Response) => {
  const guide = await prisma.guide.findUnique({
    where: { slug: req.params.slug },
    include: {
      products: {
        include: {
          product: {
            select: { title: true, slug: true, imageUrl: true, lowestPrice: true },
          },
        },
      },
    },
  });
  if (!guide || !guide.isPublished) return res.status(404).json({ error: "Guide not found" });

  await prisma.guide.update({ where: { id: guide.id }, data: { viewCount: { increment: 1 } } });
  res.json(guide);
});

import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { AppError } from "../middleware/error";

export const watchlistRouter = Router();
watchlistRouter.use(authenticate);

watchlistRouter.get("/", async (req: Request, res: Response) => {
  const lists = await prisma.watchlist.findMany({
    where: { userId: req.user!.id },
    include: {
      items: {
        include: {
          product: { select: { title: true, slug: true, imageUrl: true, lowestPrice: true } },
        },
      },
      _count: { select: { items: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
  res.json(lists);
});

watchlistRouter.post("/", validate(z.object({ name: z.string().min(1).max(100) })), async (req: Request, res: Response) => {
  const list = await prisma.watchlist.create({
    data: { name: req.body.name, userId: req.user!.id },
  });
  res.status(201).json(list);
});

watchlistRouter.post("/:id/items", validate(z.object({ productId: z.string().uuid() })), async (req: Request, res: Response) => {
  const list = await prisma.watchlist.findFirst({ where: { id: req.params.id, userId: req.user!.id } });
  if (!list) throw new AppError(404, "Watchlist not found");

  if (req.user!.tier === "FREE") {
    const count = await prisma.watchlistItem.count({ where: { watchlist: { userId: req.user!.id } } });
    if (count >= 5) throw new AppError(403, "Free tier limited to 5 tracked products. Upgrade to Pro.");
  }

  const item = await prisma.watchlistItem.create({
    data: { watchlistId: list.id, productId: req.body.productId },
  });
  res.status(201).json(item);
});

watchlistRouter.delete("/:id/items/:itemId", async (req: Request, res: Response) => {
  await prisma.watchlistItem.deleteMany({
    where: { id: req.params.itemId, watchlist: { id: req.params.id, userId: req.user!.id } },
  });
  res.json({ deleted: true });
});

watchlistRouter.delete("/:id", async (req: Request, res: Response) => {
  await prisma.watchlist.deleteMany({ where: { id: req.params.id, userId: req.user!.id } });
  res.json({ deleted: true });
});

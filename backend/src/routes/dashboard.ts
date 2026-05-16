import { Router, Request, Response } from "express";
import { prisma } from "../config/prisma";
import { authenticate } from "../middleware/auth";

export const dashboardRouter = Router();
dashboardRouter.use(authenticate);

dashboardRouter.get("/overview", async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const [alertCount, watchlistItemCount, recentViews, activeAlerts, notifications] = await Promise.all([
    prisma.alert.count({ where: { userId, isActive: true } }),
    prisma.watchlistItem.count({ where: { watchlist: { userId } } }),
    prisma.priceView.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { product: { select: { title: true, slug: true, imageUrl: true, lowestPrice: true } } },
    }),
    prisma.alert.findMany({
      where: { userId, isActive: true, lastFiredAt: { not: null } },
      include: { product: { select: { title: true, slug: true, lowestPrice: true } } },
      orderBy: { lastFiredAt: "desc" },
      take: 5,
    }),
    prisma.notification.findMany({
      where: { userId, isRead: false },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  res.json({
    stats: { alertCount, watchlistItemCount, recentViewCount: recentViews.length },
    recentViews,
    activeAlerts,
    notifications,
  });
});

dashboardRouter.get("/history", async (req: Request, res: Response) => {
  const { page = "1" } = req.query;
  const skip = (parseInt(page as string) - 1) * 20;

  const [views, total] = await Promise.all([
    prisma.priceView.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
      skip,
      take: 20,
      include: { product: { select: { title: true, slug: true, imageUrl: true, lowestPrice: true, category: true } } },
    }),
    prisma.priceView.count({ where: { userId: req.user!.id } }),
  ]);

  res.json({ views, pagination: { page: parseInt(page as string), total, pages: Math.ceil(total / 20) } });
});

dashboardRouter.get("/notifications", async (req: Request, res: Response) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  res.json(notifications);
});

dashboardRouter.post("/notifications/read", async (req: Request, res: Response) => {
  const { ids } = req.body;
  if (ids?.length) {
    await prisma.notification.updateMany({
      where: { id: { in: ids }, userId: req.user!.id },
      data: { isRead: true },
    });
  } else {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id },
      data: { isRead: true },
    });
  }
  res.json({ updated: true });
});

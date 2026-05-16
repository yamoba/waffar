import { Router, Request, Response } from "express";
import { prisma } from "../config/prisma";
import { authenticate, optionalAuth } from "../middleware/auth";

export const couponRouter = Router();

couponRouter.get("/", optionalAuth, async (req: Request, res: Response) => {
  const { store, page = "1" } = req.query;
  const where: any = { isActive: true, OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }] };
  if (store) where.store = { slug: store };

  const skip = (parseInt(page as string) - 1) * 20;
  const [coupons, total] = await Promise.all([
    prisma.coupon.findMany({
      where,
      orderBy: [{ isVerified: "desc" }, { usageCount: "desc" }],
      skip,
      take: 20,
      include: { store: { select: { name: true, slug: true, logoUrl: true } } },
    }),
    prisma.coupon.count({ where }),
  ]);

  res.json({ coupons, pagination: { page: parseInt(page as string), total, pages: Math.ceil(total / 20) } });
});

couponRouter.post("/:id/save", authenticate, async (req: Request, res: Response) => {
  await prisma.userCoupon.upsert({
    where: { userId_couponId: { userId: req.user!.id, couponId: req.params.id } },
    update: {},
    create: { userId: req.user!.id, couponId: req.params.id },
  });
  await prisma.coupon.update({ where: { id: req.params.id }, data: { usageCount: { increment: 1 } } });
  res.json({ saved: true });
});

couponRouter.get("/saved", authenticate, async (req: Request, res: Response) => {
  const saved = await prisma.userCoupon.findMany({
    where: { userId: req.user!.id },
    include: { coupon: { include: { store: { select: { name: true, slug: true, logoUrl: true } } } } },
    orderBy: { savedAt: "desc" },
  });
  res.json(saved);
});

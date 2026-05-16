import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { AppError } from "../middleware/error";

export const alertRouter = Router();
alertRouter.use(authenticate);

const createAlertSchema = z.object({
  productId: z.string().uuid(),
  type: z.enum(["PRICE_DROP", "PRICE_TARGET", "BACK_IN_STOCK", "NEW_COUPON"]),
  threshold: z.number().int().positive().optional(),
});

alertRouter.get("/", async (req: Request, res: Response) => {
  const alerts = await prisma.alert.findMany({
    where: { userId: req.user!.id },
    include: {
      product: {
        select: { title: true, slug: true, imageUrl: true, lowestPrice: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(alerts);
});

alertRouter.post("/", validate(createAlertSchema), async (req: Request, res: Response) => {
  const { productId, type, threshold } = req.body;
  const userId = req.user!.id;

  if (req.user!.tier === "FREE") {
    const count = await prisma.alert.count({ where: { userId } });
    if (count >= 3) throw new AppError(403, "Free tier limited to 3 alerts. Upgrade to Pro.");
  }

  const alert = await prisma.alert.upsert({
    where: { userId_productId_type: { userId, productId, type } },
    update: { threshold, isActive: true },
    create: { userId, productId, type, threshold },
  });

  res.status(201).json(alert);
});

alertRouter.patch("/:id", async (req: Request, res: Response) => {
  const { isActive, threshold } = req.body;
  const alert = await prisma.alert.updateMany({
    where: { id: req.params.id, userId: req.user!.id },
    data: { ...(isActive !== undefined && { isActive }), ...(threshold !== undefined && { threshold }) },
  });
  if (alert.count === 0) throw new AppError(404, "Alert not found");
  res.json({ updated: true });
});

alertRouter.delete("/:id", async (req: Request, res: Response) => {
  await prisma.alert.deleteMany({ where: { id: req.params.id, userId: req.user!.id } });
  res.json({ deleted: true });
});

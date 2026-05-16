import { Router, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { authenticate } from "../middleware/auth";
import { config } from "../config";
import { AppError } from "../middleware/error";

export const aiRouter = Router();

type ChatResponse = {
  reply: string;
  metadata?: Record<string, unknown>;
};

aiRouter.get("/advice/:productSlug", async (req: Request, res: Response) => {
  const product = await prisma.product.findUnique({
    where: { slug: req.params.productSlug },
    include: {
      listings: { where: { isActive: true }, orderBy: { price: "asc" }, include: { store: true } },
    },
  });
  if (!product) return res.status(404).json({ error: "Product not found" });

  const priceHistory = await prisma.priceHistory.findMany({
    where: { productId: product.id },
    orderBy: { timestamp: "desc" },
    take: 90,
  });

  try {
    const response = await fetch(`${config.ai.serviceUrl}/api/advice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product, priceHistory }),
    });
    const advice = await response.json();
    res.json(advice);
  } catch {
    res.json({
      recommendation: "BUY_NOW",
      confidence: 0.5,
      reasoning: "Unable to generate AI advice at this time.",
      priceOutlook: "stable",
      alternatives: [],
    });
  }
});

aiRouter.post("/chat", authenticate, async (req: Request, res: Response) => {
  const { message, chatId } = req.body;
  if (!message) throw new AppError(400, "Message required");

  let chat;
  if (chatId) {
    chat = await prisma.aiChat.findFirst({ where: { id: chatId, userId: req.user!.id } });
    if (!chat) throw new AppError(404, "Chat not found");
  } else {
    chat = await prisma.aiChat.create({ data: { userId: req.user!.id, title: message.slice(0, 100) } });
  }

  await prisma.aiMessage.create({
    data: { chatId: chat.id, role: "user", content: message },
  });

  try {
    const response = await fetch(`${config.ai.serviceUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, userId: req.user!.id }),
    });
    const data = await response.json() as ChatResponse;

    const metadata = data.metadata as Prisma.InputJsonValue | undefined;

    await prisma.aiMessage.create({
      data: { chatId: chat.id, role: "assistant", content: data.reply, metadata },
    });

    res.json({ chatId: chat.id, reply: data.reply, metadata });
  } catch {
    const fallback = "عذراً، لا أستطيع المساعدة الآن. حاول مرة أخرى لاحقاً.";
    await prisma.aiMessage.create({ data: { chatId: chat.id, role: "assistant", content: fallback } });
    res.json({ chatId: chat.id, reply: fallback });
  }
});

aiRouter.get("/chats", authenticate, async (req: Request, res: Response) => {
  const chats = await prisma.aiChat.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "desc" },
    include: { messages: { take: 1, orderBy: { createdAt: "desc" } } },
  });
  res.json(chats);
});

aiRouter.get("/chats/:id", authenticate, async (req: Request, res: Response) => {
  const chat = await prisma.aiChat.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!chat) return res.status(404).json({ error: "Chat not found" });
  res.json(chat);
});

aiRouter.get("/gift-suggestions", async (req: Request, res: Response) => {
  const { budget, age, gender, interest } = req.query;
  try {
    const response = await fetch(`${config.ai.serviceUrl}/api/gift-suggestions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ budget, age, gender, interest }),
    });
    res.json(await response.json());
  } catch {
    res.json({ suggestions: [] });
  }
});

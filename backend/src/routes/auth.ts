import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { z } from "zod";
import { v4 as uuid } from "uuid";
import { prisma } from "../config/prisma";
import { config } from "../config";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { AppError } from "../middleware/error";

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(2).max(100),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const forgotPasswordSchema = z.object({ email: z.string().email() });
const resetPasswordSchema = z.object({ token: z.string().min(20), password: z.string().min(8).max(128) });
const verifyEmailSchema = z.object({ token: z.string().min(20) });
const settingsSchema = z.object({
  preferredCurrency: z.string().default("EGP").optional(),
  preferredLocale: z.string().optional(),
  city: z.string().optional().nullable(),
  darkMode: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
  priceAlertNotifications: z.boolean().optional(),
  dealNotifications: z.boolean().optional(),
  weeklyDigest: z.boolean().optional(),
});

function generateTokens(user: { id: string; email: string; role: string; tier: string }) {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role, tier: user.tier },
    config.jwt.secret,
    { expiresIn: config.jwt.expiry as jwt.SignOptions["expiresIn"] }
  );
  const refreshToken = uuid();
  return { accessToken, refreshToken };
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function newOpaqueToken() {
  return crypto.randomBytes(32).toString("hex");
}

async function createDeviceSession(req: Request, userId: string) {
  const deviceId = req.header("x-device-id") || uuid();
  await prisma.userSession.upsert({
    where: { userId_deviceId: { userId, deviceId } },
    update: { lastSeenAt: new Date(), userAgent: req.header("user-agent"), ip: req.ip, revokedAt: null },
    create: { userId, deviceId, userAgent: req.header("user-agent"), ip: req.ip },
  });
  return deviceId;
}

authRouter.post("/register", validate(registerSchema), async (req: Request, res: Response) => {
  const { email, password, name, phone } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError(409, "Email already registered");

  const passwordHash = await bcrypt.hash(password, config.bcrypt.rounds);
  const referralCode = uuid().slice(0, 8).toUpperCase();

  const user = await prisma.user.create({
    data: { email, passwordHash, name, phone, referralCode },
  });

  const verificationToken = newOpaqueToken();
  await prisma.emailVerificationToken.create({
    data: {
      tokenHash: hashToken(verificationToken),
      userId: user.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  const { accessToken, refreshToken } = generateTokens(user);
  const deviceId = await createDeviceSession(req, user.id);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  res.status(201).json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role, tier: user.tier },
    accessToken,
    refreshToken,
    deviceId,
    verificationToken: config.isDev ? verificationToken : undefined,
  });
});

authRouter.post("/login", validate(loginSchema), async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) throw new AppError(401, "Invalid credentials");

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new AppError(401, "Invalid credentials");

  const { accessToken, refreshToken } = generateTokens(user);
  const deviceId = await createDeviceSession(req, user.id);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  res.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role, tier: user.tier },
    accessToken,
    refreshToken,
    deviceId,
  });
});

authRouter.post("/refresh", async (req: Request, res: Response) => {
  const { refreshToken: token } = req.body;
  if (!token) throw new AppError(400, "Refresh token required");

  const stored = await prisma.refreshToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!stored || stored.expiresAt < new Date()) {
    if (stored) await prisma.refreshToken.delete({ where: { id: stored.id } });
    throw new AppError(401, "Invalid or expired refresh token");
  }

  await prisma.refreshToken.delete({ where: { id: stored.id } });

  const { accessToken, refreshToken } = generateTokens(stored.user);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: stored.user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  res.json({ accessToken, refreshToken });
});

authRouter.post("/logout", authenticate, async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  }
  res.json({ message: "Logged out" });
});

authRouter.post("/logout-all", authenticate, async (req: Request, res: Response) => {
  await Promise.all([
    prisma.refreshToken.deleteMany({ where: { userId: req.user!.id } }),
    prisma.userSession.updateMany({ where: { userId: req.user!.id, revokedAt: null }, data: { revokedAt: new Date() } }),
  ]);
  res.json({ message: "Logged out from all devices" });
});

authRouter.get("/sessions", authenticate, async (req: Request, res: Response) => {
  const sessions = await prisma.userSession.findMany({
    where: { userId: req.user!.id },
    orderBy: { lastSeenAt: "desc" },
    take: 20,
  });
  res.json({ sessions });
});

authRouter.post("/forgot-password", validate(forgotPasswordSchema), async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({ where: { email: req.body.email } });
  if (!user) return res.json({ message: "If the email exists, a reset link has been sent" });
  const token = newOpaqueToken();
  await prisma.passwordResetToken.create({
    data: {
      tokenHash: hashToken(token),
      userId: user.id,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    },
  });
  res.json({ message: "If the email exists, a reset link has been sent", resetToken: config.isDev ? token : undefined });
});

authRouter.post("/reset-password", validate(resetPasswordSchema), async (req: Request, res: Response) => {
  const stored = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(req.body.token) } });
  if (!stored || stored.usedAt || stored.expiresAt < new Date()) throw new AppError(400, "Invalid or expired reset token");
  await prisma.$transaction([
    prisma.user.update({ where: { id: stored.userId }, data: { passwordHash: await bcrypt.hash(req.body.password, config.bcrypt.rounds) } }),
    prisma.passwordResetToken.update({ where: { id: stored.id }, data: { usedAt: new Date() } }),
    prisma.refreshToken.deleteMany({ where: { userId: stored.userId } }),
    prisma.userSession.updateMany({ where: { userId: stored.userId, revokedAt: null }, data: { revokedAt: new Date() } }),
  ]);
  res.json({ message: "Password reset successfully" });
});

authRouter.post("/verify-email", validate(verifyEmailSchema), async (req: Request, res: Response) => {
  const stored = await prisma.emailVerificationToken.findUnique({ where: { tokenHash: hashToken(req.body.token) } });
  if (!stored || stored.usedAt || stored.expiresAt < new Date()) throw new AppError(400, "Invalid or expired verification token");
  await prisma.$transaction([
    prisma.user.update({ where: { id: stored.userId }, data: { isVerified: true } }),
    prisma.emailVerificationToken.update({ where: { id: stored.id }, data: { usedAt: new Date() } }),
  ]);
  res.json({ message: "Email verified successfully" });
});

authRouter.get("/me", authenticate, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true, email: true, name: true, phone: true, avatarUrl: true,
      role: true, tier: true, locale: true, city: true, referralCode: true,
      createdAt: true,
    },
  });
  res.json(user);
});

authRouter.get("/settings", authenticate, async (req: Request, res: Response) => {
  const settings = await prisma.userSetting.upsert({
    where: { userId: req.user!.id },
    update: {},
    create: { userId: req.user!.id },
  });
  res.json(settings);
});

authRouter.patch("/settings", authenticate, validate(settingsSchema), async (req: Request, res: Response) => {
  const settings = await prisma.userSetting.upsert({
    where: { userId: req.user!.id },
    update: req.body,
    create: { userId: req.user!.id, ...req.body },
  });
  res.json(settings);
});

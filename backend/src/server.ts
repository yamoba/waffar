import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { config } from "./config";
import { prisma } from "./config/prisma";
import { redis } from "./config/redis";
import { errorHandler } from "./middleware/error";
import { requestLogger } from "./middleware/logger";
import { requestId } from "./middleware/request-id";
import { sanitizeInput } from "./middleware/sanitize";
import { authRouter } from "./routes/auth";
import { productRouter } from "./routes/products";
import { searchRouter } from "./routes/search";
import { storeRouter } from "./routes/stores";
import { alertRouter } from "./routes/alerts";
import { watchlistRouter } from "./routes/watchlists";
import { couponRouter } from "./routes/coupons";
import { dashboardRouter } from "./routes/dashboard";
import { adminRouter } from "./routes/admin";
import { guideRouter } from "./routes/guides";
import { aiRouter } from "./routes/ai";
import { campaignRouter } from "./routes/campaigns";
import { uploadRouter } from "./routes/upload";
import { commerceRouter } from "./routes/commerce";
import { systemRouter } from "./routes/system";

const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:", "*.amazonaws.com", "localhost:9000"],
      connectSrc: ["'self'", config.ai.serviceUrl],
    },
  },
}));

app.use(cors({ origin: config.security.corsOrigins, credentials: true }));

app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(requestId);
app.use(sanitizeInput);
app.use(requestLogger);

const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.anonymous,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || "unknown",
});
app.use("/api/", limiter);

app.get("/api/health", async (_req, res) => {
  const dbOk = await prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false);
  const redisOk = await redis.ping().then(() => true).catch(() => false);
  res.json({
    status: dbOk && redisOk ? "healthy" : "degraded",
    db: dbOk,
    redis: redisOk,
    timestamp: new Date().toISOString(),
  });
});

const mountApiRoutes = (prefix: string) => {
  app.use(`${prefix}/auth`, authRouter);
  app.use(`${prefix}/products`, productRouter);
  app.use(`${prefix}/search`, searchRouter);
  app.use(`${prefix}/stores`, storeRouter);
  app.use(`${prefix}/alerts`, alertRouter);
  app.use(`${prefix}/watchlists`, watchlistRouter);
  app.use(`${prefix}/coupons`, couponRouter);
  app.use(`${prefix}/dashboard`, dashboardRouter);
  app.use(`${prefix}/admin`, adminRouter);
  app.use(`${prefix}/guides`, guideRouter);
  app.use(`${prefix}/ai`, aiRouter);
  app.use(`${prefix}/campaigns`, campaignRouter);
  app.use(`${prefix}/upload`, uploadRouter);
  app.use(`${prefix}/commerce`, commerceRouter);
  app.use(`${prefix}/system`, systemRouter);
};

mountApiRoutes("/api");
mountApiRoutes("/api/v1");

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Waffar API running on port ${config.port}`);
});

export default app;

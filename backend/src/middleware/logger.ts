import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path !== "/api/health") {
      logger.info(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`, {
        requestId: req.requestId,
        ip: req.ip,
        userId: req.user?.id,
      });
    }
  });
  next();
}

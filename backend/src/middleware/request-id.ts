import { randomUUID } from "crypto";
import { Request, Response, NextFunction } from "express";

declare module "express-serve-static-core" {
  interface Request {
    requestId?: string;
    startedAt?: number;
  }
}

export function requestId(req: Request, res: Response, next: NextFunction) {
  const id = req.header("x-request-id") || randomUUID();
  req.requestId = id;
  req.startedAt = Date.now();
  res.setHeader("x-request-id", id);
  next();
}

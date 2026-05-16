import { Request, Response, NextFunction } from "express";
import { config } from "../config";

export function requireInternalApiKey(req: Request, res: Response, next: NextFunction) {
  const expected = config.security.internalApiKey;
  if (!expected) return res.status(503).json({ error: "Internal API key is not configured" });
  if (req.header("x-internal-api-key") !== expected) return res.status(401).json({ error: "Invalid internal API key" });
  next();
}

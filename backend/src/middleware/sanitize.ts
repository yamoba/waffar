import { Request, Response, NextFunction } from "express";

function clean(value: unknown): unknown {
  if (typeof value === "string") return value.replace(/\0/g, "").trim();
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, val]) => [key, clean(val)]));
  }
  return value;
}

export function sanitizeInput(req: Request, _res: Response, next: NextFunction) {
  req.body = clean(req.body) as typeof req.body;
  req.query = clean(req.query) as typeof req.query;
  req.params = clean(req.params) as typeof req.params;
  next();
}

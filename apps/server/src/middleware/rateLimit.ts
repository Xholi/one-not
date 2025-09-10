// apps/server/src/middleware/rateLimit.ts
import { Request, Response, NextFunction } from "express";

type RateItem = { count: number; reset: number };
const store = new Map<string, RateItem>();

export function rateLimit(windowMs = 15_000, max = 60) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip ?? "anon";
    const now = Date.now();
    const item: RateItem = store.get(key) ?? { count: 0, reset: now + windowMs };
    if (now > item.reset) {
      item.count = 0;
      item.reset = now + windowMs;
    }
    item.count++;
    store.set(key, item);

    res.setHeader("X-RateLimit-Remaining", String(Math.max(0, max - item.count)));
    if (item.count > max) return res.status(429).json({ error: "Too many requests" });
    next();
  };
}

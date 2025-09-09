import { Request, Response, NextFunction } from "express";
import { verify } from "../lib/jwt.js";

export function requireAuth(req: Request & { user?: any }, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ error: "Missing token" });
  try {
    const token = header.slice(7);
    req.user = verify(token);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

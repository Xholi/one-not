// apps/server/src/middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import { verify } from "../lib/jwt.js";

/**
 * Attaches req.user from JWT token 'Authorization: Bearer <token>'
 * If token missing/invalid -> 401
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing token" });
  }

  try {
    const token = header.slice(7);
    const decoded = verify(token) as { id: string; email?: string };
    // attach to request (types.d.ts extends Request)
    (req as any).user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

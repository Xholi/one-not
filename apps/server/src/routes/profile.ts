import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { UpdateProfileSchema } from "../validators/profile.js";

export const profile = Router();

profile.get("/me", requireAuth, async (req: any, res) => {
  const me = await prisma.user.findUnique({ where: { id: req.user.id } });
  res.json(me);
});

profile.put("/me", requireAuth, async (req: any, res) => {
  const parsed = UpdateProfileSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const me = await prisma.user.update({ where: { id: req.user.id }, data: parsed.data });
  res.json(me);
});

// Discover with Haversine (Postgres)
profile.get("/discover", requireAuth, async (req: any, res) => {
  const page = Number(req.query.page || 1);
  const limit = 25;
  // require user to have lat/lng
  const me = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!me?.latitude || !me?.longitude) {
    const list = await prisma.user.findMany({ where: { id: { not: req.user.id } }, orderBy: { createdAt: "desc" }, take: limit });
    return res.json(list);
  }
  // Haversine calculation using raw query
  const sql = `
    SELECT *, (
      6371 * acos(
        cos(radians($1)) * cos(radians(latitude))
        * cos(radians(longitude) - radians($2))
        + sin(radians($1)) * sin(radians(latitude))
      )
    ) AS distance
    FROM "User"
    WHERE id != $3
    ORDER BY distance ASC
    LIMIT $4 OFFSET $5
  `;
  const offset = (page - 1) * limit;
  const users = await prisma.$queryRawUnsafe(sql, me.latitude, me.longitude, req.user.id, limit, offset);
  res.json(users);
});

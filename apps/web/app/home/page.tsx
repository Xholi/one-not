// apps/server/src/routes/profile.ts
import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";

export const profile = Router();

profile.use(requireAuth);

profile.put("/", async (req: Request, res: Response) => {
  const id = req.user?.id;
  if (!id) return res.status(401).json({ error: "Unauthorized" });

  const UpdateProfileSchema = z.object({
    name: z.string().min(2).optional(),
    age: z.number().int().min(18).optional(),
    bio: z.string().max(160).optional(),
    city: z.string().max(100).optional(),
    country: z.string().max(100).optional(),
  });

  try {
    const parsedData = UpdateProfileSchema.parse(req.body);
    const updated = await prisma.user.update({ where: { id }, data: parsedData });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: "Invalid data", details: err });
  }
});

profile.put("/location", async (req: Request, res: Response) => {
  const id = req.user?.id;
  if (!id) return res.status(401).json({ error: "Unauthorized" });

  const UpdateLocationSchema = z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    city: z.string().max(100).optional(),
    country: z.string().max(100).optional(),
  });

  try {
    const parsedData = UpdateLocationSchema.parse(req.body);
    const updated = await prisma.user.update({ where: { id }, data: parsedData });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: "Invalid data", details: err });
  }
});

profile.put("/avatar", async (req: Request, res: Response) => {
  const id = req.user?.id;
  if (!id) return res.status(401).json({ error: "Unauthorized" });

  const UpdateAvatarSchema = z.object({ avatarUrl: z.string().url() });

  try {
    const parsedData = UpdateAvatarSchema.parse(req.body);
    const updated = await prisma.user.update({ where: { id }, data: parsedData });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: "Invalid data", details: err });
  }
});

profile.delete("/", async (req: Request, res: Response) => {
  const id = req.user?.id;
  if (!id) return res.status(401).json({ error: "Unauthorized" });
  await prisma.user.delete({ where: { id } });
  res.json({ success: true });
});

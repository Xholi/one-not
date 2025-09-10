// apps/server/src/routes/profile.ts
import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

export const profile = Router();

profile.get("/me", requireAuth, async (req: Request, res: Response) => {
  const id = (req as any).user?.id;
  if (!id) return res.status(401).json({ error: "Unauthorized" });
  const me = await prisma.user.findUnique({ where: { id } });
  res.json(me);
});

profile.put("/me", requireAuth, async (req: Request, res: Response) => {
  const id = (req as any).user?.id;
  if (!id) return res.status(401).json({ error: "Unauthorized" });
  const data = req.body;
  const updated = await prisma.user.update({ where: { id }, data });
  res.json(updated);
});

profile.post("/location", requireAuth, async (req: Request, res: Response) => {
  const id = (req as any).user?.id;
  if (!id) return res.status(401).json({ error: "Unauthorized" });
  const { latitude, longitude, city, country } = req.body;
  const updated = await prisma.user.update({ where: { id }, data: { latitude, longitude, city, country } });
  res.json(updated);
});
profile.post("/avatar", requireAuth, async (req: Request, res: Response) => {
  const id = (req as any).user?.id;
  if (!id) return res.status(401).json({ error: "Unauthorized" });
  const { avatarUrl } = req.body;
  if (!avatarUrl) return res.status(400).json({ error: "Missing avatarUrl" });
  const updated = await prisma.user.update({ where: { id }, data: { avatarUrl } });
  res.json(updated);
});

profile.get("/users", requireAuth, async (req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, age: true, bio: true, avatarUrl: true, city: true, country: true }
  });
  res.json(users);
});

profile.get("/users/:id", requireAuth, async (req: Request, res: Response) => {
  const userId = String(req.params.id);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, age: true, bio: true, avatarUrl: true, city: true, country: true }
  });
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

profile.delete("/me", requireAuth, async (req: Request, res: Response) => {
  const id = (req as any).user?.id;
  if (!id) return res.status(401).json({ error: "Unauthorized" });
  await prisma.user.delete({ where: { id } });
  res.json({ success: true });
});
  include: { from: { select: { id: true, name: true, age: true, bio: true, avatarUrl: true, city: true, country: true } } }
  });
  res.json(dislikes.map(d => d.from));
});

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      userA: { select: { id: true, name: true, age: true, bio: true, avatarUrl: true, city: true, country: true } },
      userB: { select: { id: true, name: true, age: true, bio: true, avatarUrl: true, city: true, country: true } }
    }
  });
  if (!match || (match.userAId !== userId && match.userBId !== userId)) {
    return res.status(404).json({ error: "Match not found" });
  }

  await prisma.match.delete({ where: { id: matchId } });
  // Optionally, also delete related likes, messages, etc.
  await prisma.like.deleteMany({
    where: {
      OR: [
        { fromId: match.userAId, toId: match.userBId },
        { fromId: match.userBId, toId: match.userAId }
      ]
    }
  });
  await prisma.message.deleteMany({ where: { matchId } });

  res.json({ success: true });
});profile.delete("/me", requireAuth, async (req: Request, res: Response) => {
  const id = (req as any).user?.id;
  if (!id) return res.status(401).json({ error: "Unauthorized" });
  await prisma.user.delete({ where: { id } });
  res.json({ success: true });
});

// apps/server/src/routes/swipe.ts
import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

export const swipe = Router();

swipe.post("/like/:toId", requireAuth, async (req: Request, res: Response) => {
  const fromId = (req as any).user?.id;
  const toId = String(req.params.toId);
  if (!fromId) return res.status(401).json({ error: "Unauthorized" });
  if (fromId === toId) return res.status(400).json({ error: "Cannot like self" });

  await prisma.like.create({ data: { fromId, toId } });
  const likedBack = await prisma.like.findFirst({ where: { fromId: toId, toId: fromId } });
  if (likedBack) {
    const match = await prisma.match.create({ data: { userAId: fromId, userBId: toId } });
    return res.json({ matched: true, match });
  }
  res.json({ matched: false });
});
swipe.post("/dislike/:toId", requireAuth, async (req: Request, res: Response) => {
  const fromId = (req as any).user?.id;
  const toId = String(req.params.toId);
  if (!fromId) return res.status(401).json({ error: "Unauthorized" });
  if (fromId === toId) return res.status(400).json({ error: "Cannot dislike self" });

  await prisma.dislike.create({ data: { fromId, toId } });
  res.json({ success: true });
}
);
swipe.get("/potential", requireAuth, async (req: Request, res: Response) => {
  const id = (req as any).user?.id;
  if (!id) return res.status(401).json({ error: "Unauthorized" });

  // Exclude users already liked/disliked and self
  const likedIds = await prisma.like.findMany({ where: { fromId: id }, select: { toId: true } });
  const dislikedIds = await prisma.dislike.findMany({ where: { fromId: id }, select: { toId: true } });
  const excludeIds = [id, ...likedIds.map(l => l.toId), ...dislikedIds.map(d => d.toId)];

  const potentials = await prisma.user.findMany({
    where: { id: { notIn: excludeIds } },
    select: { id: true, name: true, age: true, bio: true, avatarUrl: true, city: true, country: true }
  });
  res.json(potentials);
});
swipe.get("/likes", requireAuth, async (req: Request, res: Response) => {
  const id = (req as any).user?.id;
  if (!id) return res.status(401).json({ error: "Unauthorized" });

  const likes = await prisma.like.findMany({
    where: { toId: id },
    include: { from: { select: { id: true, name: true, age: true, bio: true, avatarUrl: true, city: true, country: true } } }
  });
  res.json(likes.map(l => l.from));
});
swipe.get("/dislikes", requireAuth, async (req: Request, res: Response) => {
  const id = (req as any).user?.id;
  if (!id) return res.status(401).json({ error: "Unauthorized" });

  const dislikes = await prisma.dislike.findMany({
    where: { toId: id },
    include: { from: { select: { id: true, name: true, age: true, bio: true, avatarUrl: true, city: true, country: true } } }
  });
  res.json(dislikes.map(d => d.from));
});
swipe.get("/matches", requireAuth, async (req: Request, res: Response) => {
  const id = (req as any).user?.id;
  if (!id) return res.status(401).json({ error: "Unauthorized" });

  const matches = await prisma.match.findMany({
    where: { OR: [{ userAId: id }, { userBId: id }] },
    include: {
      userA: { select: { id: true, name: true, age: true, bio: true, avatarUrl: true, city: true, country: true } },
      userB: { select: { id: true, name: true, age: true, bio: true, avatarUrl: true, city: true, country: true } }
    }
  });
  const formatted = matches.map(m => (m.userAId === id ? m.userB : m.userA));
  res.json(formatted);
});
swipe.get("/match/:matchId", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const matchId = Number(req.params.matchId);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  if (!matchId) return res.status(400).json({ error: "Missing match id" });

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
  const matchedUser = match.userAId === userId ? match.userB : match.userA;
  res.json(matchedUser);
});
swipe.delete("/match/:matchId", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const matchId = Number(req.params.matchId);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  if (!matchId) return res.status(400).json({ error: "Missing match id" });

  const existing = await prisma.match.findUnique({ where: { id: matchId } });
  if (!existing || (existing.userAId !== userId && existing.userBId !== userId)) {
    return res.status(404).json({ error: "Match not found" });
  }

  await prisma.match.delete({ where: { id: matchId } });
  // Optionally, also delete related likes, messages, etc.
  await prisma.like.deleteMany({
    where: {
      OR: [
        { fromId: existing.userAId, toId: existing.userBId },
        { fromId: existing.userBId  , toId: existing.userAId }
      ]
    }
  });
  await prisma.message.deleteMany({ where: { matchId } });

  res.json({ success: true });
});
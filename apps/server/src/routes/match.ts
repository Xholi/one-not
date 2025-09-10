// apps/server/src/routes/match.ts
import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

export const match = Router();

match.get("/my", requireAuth, async (req: Request, res: Response) => {
  const id = (req as any).user?.id;
  if (!id) return res.status(401).json({ error: "Unauthorized" });
  const matches = await prisma.match.findMany({
    where: { OR: [{ userAId: id }, { userBId: id }] },
    include: { userA: true, userB: true }
  });
  res.json(matches);
});
match.delete("/:matchId", requireAuth, async (req: Request, res: Response) => {
  const id = (req as any).user?.id;
  const { matchId } = req.params;
  if (!id) return res.status(401).json({ error: "Unauthorized" });

  const existing = await prisma.match.findUnique({ where: { id: Number(matchId) } });
  if (!existing || (existing.userAId !== id && existing.userBId !== id)) {
    return res.status(404).json({ error: "Match not found" });
  }

  await prisma.match.delete({ where: { id: Number(matchId) } });
  // Optionally, also delete related likes, messages, etc.
  await prisma.like.deleteMany({
    where: {
      OR: [
        { fromId: existing.userAId, toId: existing.userBId },
        { fromId: existing.userBId, toId: existing.userAId }
      ]
    }
  });
  await prisma.message.deleteMany({ where { matchId: Number(matchId) } });

  res.json({ success: true });
});


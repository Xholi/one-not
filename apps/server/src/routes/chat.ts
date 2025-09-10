// apps/server/src/routes/chat.ts
import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

export const chat = Router();

chat.get("/history/:matchId", requireAuth, async (req: Request, res: Response) => {
  const { matchId } = req.params;
  const messages = await prisma.message.findMany({ where: { matchId }, orderBy: { createdAt: "asc" } });
  res.json(messages);
});

chat.post("/send/:matchId", requireAuth, async (req: Request, res: Response) => {
  const { matchId } = req.params;
  const { text, mediaUrl } = req.body;
  const senderId = (req as any).user?.id;
  if (!senderId) return res.status(401).json({ error: "Unauthorized" });

  const msg = await prisma.message.create({
    data: { matchId, senderId, text, mediaUrl }
  });

  // emit via socket (if configured)
  req.app.get("io")?.to(matchId).emit("message", msg);
  res.json(msg);
});
chat.post("/read/:matchId", requireAuth, async (req: Request, res: Response) => {
  const { matchId } = req.params;
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
    await prisma.message.updateMany({ where: { matchId, senderId: { not: userId }, read: false }, data: { read: true } });
    res.json({ success: true });
});

import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { MessageSchema } from "../validators/chat.js";

export const chat = Router();

chat.get("/history/:matchId", requireAuth, async (req: any, res) => {
  const { matchId } = req.params;
  const messages = await prisma.message.findMany({ where: { matchId }, orderBy: { createdAt: "asc" } });
  res.json(messages);
});

chat.post("/send/:matchId", requireAuth, async (req: any, res) => {
  const { matchId } = req.params;
  const parsed = MessageSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const msg = await prisma.message.create({ data: { matchId, senderId: req.user.id, ...parsed.data } });
  // emit via socket
  req.app.get("io")?.to(matchId).emit("message", msg);
  res.json(msg);
});

import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

export const match = Router();

match.get("/my", requireAuth, async (req: any, res) => {
  const id = req.user.id;
  const matches = await prisma.match.findMany({
    where: { OR: [{ userAId: id }, { userBId: id }] },
    include: { userA: true, userB: true }
  });
  res.json(matches);
});

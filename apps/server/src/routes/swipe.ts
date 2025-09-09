import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
export const swipe = Router();
swipe.post('/like/:toId', requireAuth, async (req,res)=>{
  const fromId = req.user.id; const toId = String(req.params.toId); if(fromId===toId) return res.status(400).json({error:'Cannot like self'});
  await prisma.like.create({ data:{ fromId, toId } }); const likedBack = await prisma.like.findFirst({ where:{ fromId: toId, toId: fromId } });
  if(likedBack){ const match = await prisma.match.create({ data:{ userAId: fromId, userBId: toId } }); return res.json({ matched:true, match }); }
  res.json({ matched:false });
});

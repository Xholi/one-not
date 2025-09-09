import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
export const chat = Router();
chat.get('/history/:matchId', requireAuth, async (req,res)=>{
  const { matchId } = req.params; const messages = await prisma.message.findMany({ where:{ matchId }, orderBy:{ createdAt:'asc' } }); res.json(messages);
});
chat.post('/send/:matchId', requireAuth, async (req,res)=>{
  const { matchId } = req.params; const { text, mediaUrl } = req.body; const msg = await prisma.message.create({ data:{ matchId, senderId: req.user.id, text, mediaUrl } }); req.app.get('io')?.to(matchId).emit('message', msg); res.json(msg);
});
export { chat };

import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
export const admin = Router();
admin.get('/stats', async (_req,res)=>{ const [users,matches,messages] = await Promise.all([prisma.user.count(), prisma.match.count(), prisma.message.count()]); res.json({ users, matches, messages }); });

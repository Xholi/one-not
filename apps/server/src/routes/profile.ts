import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
export const profile = Router();
profile.get('/me', requireAuth, async (req,res)=>{
  const me = await prisma.user.findUnique({ where:{ id: req.user.id } }); res.json(me);
});
profile.put('/me', requireAuth, async (req,res)=>{
  const data = req.body; const upd = await prisma.user.update({ where:{ id: req.user.id }, data }); res.json(upd);
});
profile.post('/location', requireAuth, async (req,res)=>{
  const { latitude, longitude, city, country } = req.body; const updated = await prisma.user.update({ where:{ id: req.user.id }, data:{ latitude, longitude, city, country } }); res.json(updated);
});
profile.get('/discover', requireAuth, async (req,res)=>{
  const { lat, lng, km } = req.query; const limit=50; const kms = Number(km||50);
  if(lat && lng){
    const sql = `SELECT *, ( 6371 * acos( cos(radians($1)) * cos(radians(latitude)) * cos(radians(longitude) - radians($2)) + sin(radians($1)) * sin(radians(latitude)) ) ) AS distance FROM "User" WHERE id != $3 AND latitude IS NOT NULL AND longitude IS NOT NULL HAVING distance < $4 ORDER BY distance ASC LIMIT $5`;
    const users = await prisma.$queryRawUnsafe(sql, Number(lat), Number(lng), req.user.id, kms, limit);
    return res.json(users);
  }
  const list = await prisma.user.findMany({ where:{ id:{ not: req.user.id } }, take:25 }); res.json(list);
});

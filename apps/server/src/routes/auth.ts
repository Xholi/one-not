import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { sign } from '../lib/jwt.js';
export const auth = Router();
auth.post('/register', async (req,res)=>{
  const { email,password,displayName,age } = req.body;
  if(!email||!password) return res.status(400).json({error:'missing'});
  const exists = await prisma.user.findUnique({ where:{ email } });
  if(exists) return res.status(400).json({ error:'Email in use' });
  const passwordHash = await bcrypt.hash(password,10);
  const user = await prisma.user.create({ data:{ email, passwordHash, displayName: displayName||email.split('@')[0], age: age||21 } });
  res.json({ token: sign({ id:user.id, email:user.email }), user:{ id:user.id, displayName:user.displayName } });
});
auth.post('/login', async (req,res)=>{
  const { email,password } = req.body; const user = await prisma.user.findUnique({ where:{ email } });
  if(!user) return res.status(401).json({ error:'Invalid credentials' }); const ok = await bcrypt.compare(password, user.passwordHash);
  if(!ok) return res.status(401).json({ error:'Invalid credentials' }); res.json({ token: sign({ id:user.id, email:user.email }), user:{ id:user.id, displayName:user.displayName } });
});

import { Request, Response, NextFunction } from 'express';
import { verify } from '../lib/jwt.js';
export function requireAuth(req, res, next){
  const header = req.headers.authorization; if(!header?.startsWith('Bearer ')) return res.status(401).json({error:'Missing token'});
  try{ req.user = verify(header.slice(7)); next(); }catch{ res.status(401).json({error:'Invalid token'}); }
}

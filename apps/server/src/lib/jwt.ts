import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';
export const sign = (u)=> jwt.sign(u, JWT_SECRET, { expiresIn: '7d' });
export const verify = (t)=> jwt.verify(t, JWT_SECRET);

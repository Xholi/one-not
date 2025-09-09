import { Router } from 'express';
import Stripe from 'stripe';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
const stripe = new Stripe(process.env.STRIPE_SECRET||'', { apiVersion: '2024-11-01' });
export const billing = Router();
billing.post('/create-checkout-session', requireAuth, async (req,res)=>{
  const { tier } = req.body; const PRICE_IDS = { basic: process.env.PRICE_BASIC, premium: process.env.PRICE_PREMIUM, vip: process.env.PRICE_VIP };
  if(!PRICE_IDS[tier]) return res.status(400).json({ error:'Invalid tier' });
  const session = await stripe.checkout.sessions.create({ mode:'subscription', line_items:[{ price: PRICE_IDS[tier], quantity:1 }], customer_email: req.user.email, success_url: `${process.env.SERVER_ORIGIN}/billing/success`, cancel_url:`${process.env.SERVER_ORIGIN}/billing/cancel`, metadata:{ userId: req.user.id } });
  res.json({ url: session.url });
});
billing.post('/webhook', async (req,res)=>{ res.json({received:true}); });

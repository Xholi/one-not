// apps/server/src/routes/billing.ts
import { Router, Request, Response } from "express";
import Stripe from "stripe";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const stripeApiVersion = "2022-11-15"; // keep compatible with @types/stripe packages
const stripe = new Stripe(process.env.STRIPE_SECRET || "", { apiVersion: stripeApiVersion });

export const billing = Router();

const PRICE_IDS: Record<"basic" | "premium" | "vip", string | undefined> = {
  basic: process.env.PRICE_BASIC,
  premium: process.env.PRICE_PREMIUM,
  vip: process.env.PRICE_VIP
};

billing.post("/create-checkout-session", requireAuth, async (req: Request, res: Response) => {
  const tier = (req.body?.tier as "basic" | "premium" | "vip") ?? "basic";
  const priceId = PRICE_IDS[tier];
  if (!priceId) return res.status(400).json({ error: "Invalid tier or price not configured" });

  // req.user is typed by types.d.ts
  const user = (req as any).user;
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: user?.email,
    success_url: `${process.env.SERVER_ORIGIN}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.SERVER_ORIGIN}/billing/cancel`,
    metadata: { userId: user?.id }
  });

  res.json({ url: session.url });
});

// minimal webhook handler — production should verify signature using raw body
billing.post("/webhook", async (req: Request, res: Response) => {
  res.json({ received: true });
});
// Example of handling an event:
// billing.post("/webhook", express.raw({ type: 'application/json' }), async (req, res) => {
//   let event: Stripe.Event;
//   try {
//     event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'] || '', process.env.STRIPE_WEBHOOK_SECRET || '');
//   } catch (err) {
//     console.log(`⚠️  Webhook signature verification failed.`, err.message);
//     return res.sendStatus(400);
//   }
//   // Handle the event
//   switch (event.type) {
//     case 'checkout.session.completed':
//       const session = event.data.object as Stripe.Checkout.Session;
//       // Then define and call a function to handle the event checkout.session.completed
//       break;
//     // ... handle other event types
//     default:
//       console.log(`Unhandled event type ${event.type}`);
//   }
//   res.json({ received: true });
// });

billing.get("/subscriptions", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.stripeCustomerId) return res.json({ subscriptions: [] });

  const subs = await stripe.subscriptions.list({
    customer: user.stripeCustomerId,
    status: "all",
    expand: ["data.default_payment_method"]
  });
  res.json({ subscriptions: subs.data });
});
});

billing.post("/cancel-subscription", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { subscriptionId } = req.body;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  if (!subscriptionId) return res.status(400).json({ error: "Missing subscriptionId" });

  // verify ownership
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.stripeCustomerId) return res.status(400).json({ error: "No subscriptions found" });
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  if (sub.customer !== user.stripeCustomerId) return res.status(403).json({ error: "Forbidden" });

  // cancel at period end
  const canceled = await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });
  res.json(canceled);
}
);

billing.post("/resume-subscription", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { subscriptionId } = req.body;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  if (!subscriptionId) return res.status(400).json({ error: "Missing subscriptionId" });

  // verify ownership
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.stripeCustomerId) return res.status(400).json({ error: "No subscriptions found" });
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  if (sub.customer !== user.stripeCustomerId) return res.status(403).json({ error: "Forbidden" });
  if (!sub.cancel_at_period_end) return res.status(400).json({ error: "Subscription is not canceled" });

  // resume by removing cancel_at_period_end
  const resumed = await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: false });
  res.json(resumed);
}
);

billing.get("/prices", async (req: Request, res: Response) => {
  const prices = await stripe.prices.list({ active: true, limit: 10 });
  res.json(prices.data);
});

billing.get("/products", async (req: Request, res: Response) => {
  const products = await stripe.products.list({ active: true, limit: 10 });
  res.json(products.data);
});

billing.get("/products-with-prices", async (req: Request, res: Response) => {
  const products = await stripe.products.list({ active: true, limit: 10 });
  const prices = await stripe.prices.list({ active: true, limit: 100 });
  const productsWithPrices = products.data.map(product => ({
    ...product,
    prices: prices.data.filter(price => price.product === product.id)
  }));
  res.json(productsWithPrices);
});

billing.get("/invoices", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.stripeCustomerId) return res.json({ invoices: [] });

  const invoices = await stripe.invoices.list({ customer: user.stripeCustomerId, limit: 10 });
  res.json(invoices.data);
});

billing.get("/invoice/:id", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const invoiceId = String(req.params.id);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  if (!invoiceId) return res.status(400).json({ error: "Missing invoice id" });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.stripeCustomerId) return res.status(404).json({ error: "Invoice not found" });

  const invoice = await stripe.invoices.retrieve(invoiceId);
  if (invoice.customer !== user.stripeCustomerId) return res.status(403).json({ error: "Forbidden" });

  res.json(invoice);
});

billing.get("/portal-session", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.stripeCustomerId) return res.status(400).json({ error: "No customer found" });

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${process.env.SERVER_ORIGIN}/billing/portal-return`
  });

  res.json({ url: session.url });
});

billing.get("/subscription-plans", async (req: Request, res: Response) => {
  const plans = Object.keys(PRICE_IDS).map(tier => ({
    tier,
    priceId: PRICE_IDS[tier as "basic" | "premium" | "vip"]
  }));
  res.json(plans);
});

billing.get("/config", (req: Request, res: Response) => {
  res.json({
    publicKey: process.env.STRIPE_PUBLIC || null,
    tiers: Object.keys(PRICE_IDS).map(tier => ({
      tier,
      priceId: PRICE_IDS[tier as "basic" | "premium" | "vip"]
    }))
  });
});

billing.get("/success", (req: Request, res: Response) => {
  res.send("Payment successful! You can close this window.");
});

billing.get("/cancel", (req: Request, res: Response) => {
  res.send("Payment canceled. You can close this window.");
});

billing.get("/portal-return", (req: Request, res: Response) => {
  res.send("You have returned from the billing portal. You can close this window.");
});


import { Router } from "express";
import Stripe from "stripe";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const stripe = new Stripe(process.env.STRIPE_SECRET!, { apiVersion: "2024-11-01" });
export const billing = Router();

const PRICE_IDS: Record<string,string> = {
  basic: process.env.PRICE_BASIC || "",
  premium: process.env.PRICE_PREMIUM || "",
  vip: process.env.PRICE_VIP || ""
};

billing.post("/create-checkout-session", requireAuth, async (req:any, res) => {
  const { tier } = req.body as { tier: "basic" | "premium" | "vip" };
  if (!PRICE_IDS[tier]) return res.status(400).json({ error: "Invalid tier" });
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: PRICE_IDS[tier], quantity: 1 }],
    customer_email: req.user.email,
    success_url: `${process.env.SERVER_ORIGIN}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.SERVER_ORIGIN}/billing/cancel`,
    metadata: { userId: req.user.id }
  });
  res.json({ url: session.url });
});

// Raw body required for stripe signature verification — ensure express.raw is used for /billing/webhook
billing.post("/webhook", async (req:any, res) => {
  const sig = req.headers["stripe-signature"] as string | undefined;
  const raw = req.rawBody as Buffer | undefined;
  if (!sig || !raw) return res.status(400).send("Missing signature or raw body");
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err:any) {
    console.error("Stripe webhook verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("checkout.session.completed", session.id);
        break;
      }
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        if (!invoice.subscription) break;
        const subscription = await stripe.subscriptions.retrieve(String(invoice.subscription));
        const customerEmail = (invoice.customer as any)?.email ?? invoice.customer_email;
        const user = customerEmail ? await prisma.user.findUnique({ where: { email: String(customerEmail) } }) : null;
        if (user) {
          await prisma.subscription.upsert({
            where: { stripeSubscriptionId: subscription.id },
            update: {
              status: subscription.status as string,
              currentPeriodStart: new Date((subscription.current_period_start ?? 0) * 1000),
              currentPeriodEnd: new Date((subscription.current_period_end ?? 0) * 1000)
            },
            create: {
              userId: user.id,
              stripeSubscriptionId: subscription.id,
              status: subscription.status as string,
              priceId: String(subscription.items.data[0].price?.id ?? ""),
              currentPeriodStart: new Date((subscription.current_period_start ?? 0) * 1000),
              currentPeriodEnd: new Date((subscription.current_period_end ?? 0) * 1000)
            }
          });
          await prisma.boost.create({ data: { userId: user.id, expiresAt: new Date((subscription.current_period_end ?? 0) * 1000) } }).catch(() => null);
        }
        break;
      }
      case "customer.subscription.deleted":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        await prisma.subscription.updateMany({ where: { stripeSubscriptionId: sub.id }, data: { status: sub.status as string, currentPeriodEnd: new Date((sub.current_period_end ?? 0) * 1000) } }).catch(()=>null);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("Error processing webhook", err);
    return res.status(500).send();
  }
  res.json({ received: true });
});

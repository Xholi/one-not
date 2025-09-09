import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import http from "http";
import { rateLimit } from "./middleware/rateLimit.js";
import { auth } from "./routes/auth.js";
import { profile } from "./routes/profile.js";
import { swipe } from "./routes/swipe.js";
import { match } from "./routes/match.js";
import { chat } from "./routes/chat.js";
import { admin } from "./routes/admin.js";
import { billing } from "./routes/billing.js";
import { createSocket } from "./socket.js";
import bodyParser from "body-parser";

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.SERVER_ORIGIN?.split(",") || "*" }));

// for Stripe webhook only
app.use('/billing/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: "2mb" }));
app.use(rateLimit());

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/auth", auth);
app.use("/profile", profile);
app.use("/swipe", swipe);
app.use("/match", match);
app.use("/chat", chat);
app.use("/admin", admin);
app.use("/billing", billing);

const server = http.createServer(app);
const io = createSocket(server);
app.set("io", io);

const PORT = Number(process.env.SERVER_PORT || 4000);
server.listen(PORT, () => console.log(`API ready on :${PORT}`));

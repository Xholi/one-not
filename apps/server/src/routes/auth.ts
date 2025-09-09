import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { sign } from "../lib/jwt.js";
import { LoginSchema, RegisterSchema } from "../validators/auth.js";

export const auth = Router();

auth.post("/register", async (req, res) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const { email, password, displayName, age, gender } = parsed.data;
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return res.status(400).json({ error: "Email in use" });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, passwordHash, displayName, age, gender } });
  const token = sign({ id: user.id, email: user.email });
  res.json({ token, user: { id: user.id, email: user.email, displayName: user.displayName } });
});

auth.post("/login", async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });
  const token = sign({ id: user.id, email: user.email });
  res.json({ token, user: { id: user.id, email: user.email, displayName: user.displayName } });
});

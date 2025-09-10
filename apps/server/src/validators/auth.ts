import { z } from "zod";
// import {
//   UpdateProfileSchema,
//   UpdateLocationSchema,
//   UpdateAvatarSchema,
// } from "../validators/auth.js";

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(2),
  age: z.number().int().min(18),
  gender: z.string().optional(),
  bio: z.string().max(160).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});



import { z } from "zod";
export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(2),
  age: z.number().int().min(18),
  gender: z.string().optional(),
});
export const LoginSchema = z.object({ email: z.string().email(), password: z.string().min(8) });

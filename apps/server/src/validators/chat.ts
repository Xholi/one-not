import { z } from "zod";
export const MessageSchema = z.object({ text: z.string().min(1).max(2000).optional(), mediaUrl: z.string().url().optional() }).refine(v => v.text || v.mediaUrl, { message: "text or mediaUrl required" });

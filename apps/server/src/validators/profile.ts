import { z } from "zod";
export const UpdateProfileSchema = z.object({
  bio: z.string().max(500).optional(),
  interests: z.array(z.string()).max(20).optional(),
  photos: z.array(z.string().url()).max(6).optional(),
  gender: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional()
});

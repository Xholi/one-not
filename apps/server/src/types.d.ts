// apps/server/src/types.d.ts
import { User } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: User | { id: string; email?: string }; // allow minimal shape for JWT-only scenarios
    }
  }
}

// To ensure this file is picked up by TypeScript, we don't export anything.
export {};

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);
  const users = Array.from({ length: 6 }).map((_, i) => ({
    email: `user${i + 1}@demo.dev`,
    passwordHash,
    displayName: `Demo ${i + 1}`,
    age: 21 + (i % 10),
    gender: i % 2 === 0 ? "male" : "female",
    bio: "Demo account for testing.",
    photos: [
      `https://picsum.photos/seed/${i + 1}/600/800`,
      `https://picsum.photos/seed/${i + 100}/600/800`
    ],
    interests: ["music", "fitness", "travel"].slice(0, (i % 3) + 1)
  }));
  for (const data of users) await prisma.user.create({ data });
  console.log("Seeded demo users");
}

main().finally(() => prisma.$disconnect());

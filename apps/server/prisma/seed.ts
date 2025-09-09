import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();
async function main(){ 
  const pw = await bcrypt.hash('password123',10);
  for(let i=1;i<=8;i++){
    await prisma.user.create({ data: {
      email:`user${i}@demo.dev`, passwordHash:pw, displayName:`Demo ${i}`, age:20+i,
      gender: i%2===0?'male':'female',
      bio:'Demo account', photos:[`https://picsum.photos/seed/${i}/600/800`],
      interests:['music','travel'].slice(0,(i%2)+1),
      latitude: -26.0 + i*0.01, longitude: 28.0 + i*0.01, city:'Johannesburg', country:'ZA'
    }});
  }
  console.log('seeded');
}
main().finally(()=>prisma.$disconnect());

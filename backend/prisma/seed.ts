import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // TODO: Add actual seed logic here
  // Example: await prisma.user.create({ data: { email: 'admin@example.com', passwordHash: 'hashed_password' } });
  console.log('Seed completed.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

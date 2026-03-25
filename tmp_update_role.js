const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const result = await prisma.user.update({
    where: { id: 13 },
    data: { role: 'ADMIN' }
  });
  console.log('User 13 Updated:', result.role);
}
main().catch(console.error).finally(() => prisma.$disconnect());

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const monthly = await prisma.subscription.updateMany({
    where: { 
      plan: { contains: 'Monthly' }, 
      amount: null 
    },
    data: { amount: 20 }
  });

  const yearly = await prisma.subscription.updateMany({
    where: { 
      plan: { contains: 'Yearly' }, 
      amount: null 
    },
    data: { amount: 200 }
  });

  console.log('Successfully updated ' + monthly.count + ' monthly and ' + yearly.count + ' yearly subscriptions.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

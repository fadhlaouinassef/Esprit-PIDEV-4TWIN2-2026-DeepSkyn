// Load environment variables manually
const fs = require('fs');
const path = require('path');
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value;
    }
  });
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    },
  },
});

async function main() {
  console.log('Using URL:', process.env.DATABASE_URL);
  
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

  const others = await prisma.subscription.updateMany({
    where: { amount: null },
    data: { amount: 0 }
  });

  console.log('✅ Success:');
  console.log('Fixed ' + monthly.count + ' monthly and ' + yearly.count + ' yearly subscriptions.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

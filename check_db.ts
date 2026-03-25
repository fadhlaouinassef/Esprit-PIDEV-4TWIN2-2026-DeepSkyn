import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  const count = await prisma.$queryRawUnsafe<any[]>('SELECT COUNT(*) as total FROM "SkinScoreAnalysis"');
  console.log('Total analyses in DB:', count.map((r: any) => ({ total: String(r.total) })));

  const rows = await prisma.$queryRawUnsafe<any[]>(
    'SELECT id, user_id, score, trigger, created_at FROM "SkinScoreAnalysis" ORDER BY created_at DESC LIMIT 10'
  );
  console.log('Sample rows:', JSON.stringify(rows, null, 2));

  const users = await prisma.$queryRawUnsafe<any[]>('SELECT id, email FROM "User" LIMIT 5');
  console.log('Users:', JSON.stringify(users));

  await pool.end();
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });

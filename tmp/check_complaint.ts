import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

async function main() {
    const rows = await p.$queryRawUnsafe<any[]>(
        `SELECT column_name, data_type, is_nullable, column_default
         FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'Complaint'
         ORDER BY ordinal_position`
    );
    console.log("=== Complaint table columns ===");
    console.table(rows);
}

main()
    .then(() => p.$disconnect())
    .catch(e => { console.error(e); p.$disconnect(); });

import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function fix() {
    const client = await pool.connect();
    try {
        // Show current columns BEFORE fix
        const before = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'Complaint'
            ORDER BY ordinal_position
        `);
        console.log('=== BEFORE: Complaint columns ===');
        console.table(before.rows);

        // Drop legacy columns that are NOT in the Prisma schema
        const legacyDrops = [
            { col: 'nom',   drop: `ALTER TABLE "Complaint" DROP COLUMN IF EXISTS "nom"` },
            { col: 'image', drop: `ALTER TABLE "Complaint" DROP COLUMN IF EXISTS "image"` },
        ];
        for (const { col, drop } of legacyDrops) {
            console.log(`Dropping legacy column: ${col}`);
            await client.query(drop);
        }

        // Make sure the required columns exist and are correct
        const ensures = [
            `ALTER TABLE "Complaint" ADD COLUMN IF NOT EXISTS "content" TEXT NOT NULL DEFAULT ''`,
            `ALTER TABLE "Complaint" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL`,
        ];
        for (const sql of ensures) {
            console.log(`Ensuring column: ${sql}`);
            await client.query(sql);
        }

        // Show columns AFTER fix
        const after = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'Complaint'
            ORDER BY ordinal_position
        `);
        console.log('\n=== AFTER: Complaint columns ===');
        console.table(after.rows);

        console.log('\n✅ Fix complete!');
    } finally {
        client.release();
        await pool.end();
    }
}

fix().catch(console.error);

import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
    const client = await pool.connect();
    try {
        const res = await client.query(`
            SELECT column_name, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'Complaint'
            ORDER BY ordinal_position
        `);
        console.log('Complaint columns after fix:');
        for (const r of res.rows) {
            const nullable = r.is_nullable === 'YES' ? '(nullable)' : '(NOT NULL)';
            console.log(`  ${r.column_name} ${nullable} default=${r.column_default}`);
        }
    } finally {
        client.release();
        await pool.end();
    }
}
check().catch(console.error);


import { prisma } from './prisma/prisma.config';

async function check() {
    try {
        const tableInfo = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
        console.log('TABLES:', JSON.stringify(tableInfo, null, 2));

        const result = await prisma.$queryRaw`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'User' AND (column_name = 'status' OR column_name = 'verified')`;
        console.log('COLUMNS INFO:', JSON.stringify(result, null, 2));

        const enums = await prisma.$queryRaw`SELECT typname FROM pg_type WHERE typname = 'UserStatus'`;
        console.log('USERSTATUS ENUM:', JSON.stringify(enums, null, 2));

        const count = await prisma.user.count({ where: { verified: false } });
        console.log('PENDING USERS COUNT:', count);

    } catch (e: any) {
        console.error('DIAG ERROR:', e.message);
    } finally {
        process.exit();
    }
}

check();

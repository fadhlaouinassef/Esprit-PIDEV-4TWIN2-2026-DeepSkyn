import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Checking database connection...");
        const res = await (prisma as any).$queryRaw`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Complaint'`;
        console.log("Columns in 'Complaint' table:");
        console.table(res);
    } catch (error) {
        console.error("Error inspecting database:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();

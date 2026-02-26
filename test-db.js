const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
    datasourceUrl: "postgresql://postgres.ckcfabinoxgvcqzoevge:ywmtn7482000@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
});

async function main() {
    try {
        const greenhouses = await prisma.greenhouse.findMany();
        console.log("Success! count:", greenhouses.length);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
main();

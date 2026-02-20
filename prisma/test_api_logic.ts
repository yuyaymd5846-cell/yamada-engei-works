
import prisma from '../src/lib/prisma'; // Adjust path if needed, ts-node might need help

async function main() {
    try {
        const rotations = await prisma.pesticideRotation.findMany({
            orderBy: {
                label: 'asc'
            }
        });
        console.log(`Found ${rotations.length} rotations via lib/prisma`);
        console.log(JSON.stringify(rotations, null, 2));
    } catch (e) {
        console.error("Error fetching rotations:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();

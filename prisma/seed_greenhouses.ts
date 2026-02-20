
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const initialGreenhouses = [
    { name: '1号ハウス', areaAcre: 10.0 },
    { name: '2号ハウス', areaAcre: 15.0 },
    { name: '3号ハウス', areaAcre: 8.5 },
    { name: '新ハウスA', areaAcre: 12.0 },
]

async function main() {
    console.log('Seeding greenhouses...')
    for (const gh of initialGreenhouses) {
        await prisma.greenhouse.upsert({
            where: { id: gh.name }, // Dummy ID for matching in this context or findFirst
            update: {},
            create: gh,
        }).catch(async () => {
            // Simple create if upsert fails on where (id usually doesn't match name)
            await prisma.greenhouse.create({ data: gh })
        })
    }
    console.log('Greenhouse seeding finished.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })

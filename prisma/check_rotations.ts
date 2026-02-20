
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const count = await prisma.pesticideRotation.count()
    console.log(`Total rotations in DB: ${count}`)
    const all = await prisma.pesticideRotation.findMany()
    console.log(JSON.stringify(all, null, 2))
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

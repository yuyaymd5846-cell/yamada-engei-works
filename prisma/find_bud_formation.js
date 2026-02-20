
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const works = await prisma.workManual.findMany({
        where: { workName: { contains: '発蕾' } }
    })
    console.log(JSON.stringify(works, null, 2))
}

main().catch(console.error).finally(() => prisma.$disconnect())

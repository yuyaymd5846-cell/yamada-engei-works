
import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const prisma = new PrismaClient()

async function main() {
    const manuals = await prisma.workManual.findMany()
    fs.writeFileSync('all_manuals.json', JSON.stringify(manuals, null, 2), 'utf-8')
}

main()
    .finally(() => prisma.$disconnect())

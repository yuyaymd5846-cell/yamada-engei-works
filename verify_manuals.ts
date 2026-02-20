
import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const prisma = new PrismaClient()

async function main() {
    const manual = await prisma.workManual.findFirst({
        where: { workName: '杭打ち' }
    })

    if (manual) {
        fs.writeFileSync('verify_staking.json', JSON.stringify(manual, null, 2), 'utf-8')
        console.log('Record found and saved to verify_staking.json')
    } else {
        // Check if it's there but garbled
        const all = await prisma.workManual.findMany()
        fs.writeFileSync('verify_all.json', JSON.stringify(all, null, 2), 'utf-8')
        console.log('Record not found with name 杭打ち. Check verify_all.json')
    }
}

main()
    .finally(() => prisma.$disconnect())

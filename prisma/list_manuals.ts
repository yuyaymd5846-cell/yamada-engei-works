
import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()
async function main() {
    const manuals = await p.workManual.findMany({ select: { workName: true } })
    console.log(manuals.map(m => m.workName))
}
main().finally(() => p.$disconnect())


import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()
async function main() {
    const gs = await p.greenhouse.findMany()
    console.log(JSON.stringify(gs, null, 2))
}
main().finally(() => p.$disconnect())

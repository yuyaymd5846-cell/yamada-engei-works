
import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const prisma = new PrismaClient()

async function main() {
    console.log('Exporting data from SQLite...')

    const manuals = await prisma.workManual.findMany()
    const greenhouses = await prisma.greenhouse.findMany()
    const records = await prisma.workRecord.findMany()
    const cycles = await prisma.cropCycle.findMany()
    const schedules = await prisma.cropSchedule.findMany()
    const rotations = await prisma.pesticideRotation.findMany()

    const data = {
        manuals,
        greenhouses,
        records,
        cycles,
        schedules,
        rotations
    }

    fs.writeFileSync('prisma/migration_data.json', JSON.stringify(data, null, 2))
    console.log('Data exported to prisma/migration_data.json')
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

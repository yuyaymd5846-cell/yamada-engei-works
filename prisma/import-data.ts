
import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const prisma = new PrismaClient()

async function main() {
    if (!fs.existsSync('prisma/migration_data.json')) {
        console.error('No migration data found!')
        return
    }

    const data = JSON.parse(fs.readFileSync('prisma/migration_data.json', 'utf8'))
    console.log('Importing data to PostgreSQL...')

    // Clean data first to avoid duplicates if re-running
    await prisma.$transaction([
        prisma.pesticideRotation.deleteMany(),
        prisma.cropSchedule.deleteMany(),
        prisma.cropCycle.deleteMany(),
        prisma.workRecord.deleteMany(),
        prisma.greenhouse.deleteMany(),
        prisma.workManual.deleteMany(),
    ])

    // Import sequentially to respect potential future relations
    await prisma.workManual.createMany({ data: data.manuals })
    await prisma.greenhouse.createMany({ data: data.greenhouses })
    await prisma.workRecord.createMany({ data: data.records })
    await prisma.cropCycle.createMany({ data: data.cycles })
    await prisma.cropSchedule.createMany({ data: data.schedules })
    await prisma.pesticideRotation.createMany({ data: data.rotations })

    console.log('Data migration complete!')
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

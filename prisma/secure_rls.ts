import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const tables = [
        'work_manual',
        'greenhouses',
        'work_records',
        'crop_cycles',
        'crop_schedules',
        'pesticide_rotations'
    ]

    for (const table of tables) {
        console.log(`Enabling RLS on table: ${table}...`)
        // Execute raw SQL to enable Row Level Security
        await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`)
    }

    console.log('Successfully enabled RLS on all 6 tables!')
    console.log('Without any specific policies, this blocks all public REST API access to these tables.')
    console.log('Prisma will continue to work normally as it logs in using the postgres admin role which bypasses RLS.')
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

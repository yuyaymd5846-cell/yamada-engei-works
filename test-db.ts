import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "postgresql://postgres:ywmtn7482000@db.ckcfabinoxgvcqzoevge.supabase.co:5432/postgres?sslmode=require"
        }
    }
})

async function main() {
    try {
        const count = await prisma.greenhouse.count()
        console.log('Connection success! Greenhouse count:', count)
    } catch (e: any) {
        console.error('Connection failed:', e.message)
    } finally {
        await prisma.$disconnect()
    }
}

main()

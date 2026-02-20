
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const records = await prisma.workRecord.findMany({
            orderBy: { date: 'desc' }
        })

        // Simplify data for AI context
        const simplifiedRecords = records.map(r => ({
            date: r.date.toISOString().split('T')[0],
            work: r.workName,
            gh: r.greenhouseName,
            time: r.spentTime,
            area: r.areaAcre, // actually are
            note: r.note || ''
        }))

        return NextResponse.json(simplifiedRecords)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to export data' }, { status: 500 })
    }
}

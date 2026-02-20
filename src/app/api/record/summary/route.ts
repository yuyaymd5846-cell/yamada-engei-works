
import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'week' // today, week, month, all

    let startDate = new Date()
    if (period === 'today') {
        startDate.setHours(0, 0, 0, 0)
    } else if (period === 'week') {
        startDate.setDate(startDate.getDate() - 7)
    } else if (period === 'month') {
        startDate.setMonth(startDate.getMonth() - 1)
    } else {
        startDate = new Date(0) // All time
    }

    try {
        const records = await prisma.workRecord.findMany({
            where: {
                date: { gte: startDate }
            }
        })

        // Aggregation logic
        const totalHours = records.reduce((sum, r) => sum + r.spentTime, 0)

        const byGreenhouse = records.reduce((acc, r) => {
            acc[r.greenhouseName] = (acc[r.greenhouseName] || 0) + r.spentTime
            return acc
        }, {} as Record<string, number>)

        const byWorkName = records.reduce((acc, r) => {
            acc[r.workName] = (acc[r.workName] || 0) + r.spentTime
            return acc
        }, {} as Record<string, number>)

        return NextResponse.json({
            totalHours,
            count: records.length,
            byGreenhouse: Object.entries(byGreenhouse).map(([name, hours]) => ({ name, hours })),
            byWorkName: Object.entries(byWorkName).map(([name, hours]) => ({ name, hours })),
        })
    } catch (error) {
        console.error('Aggregation error:', error)
        return NextResponse.json({ error: 'Failed to aggregate data' }, { status: 500 })
    }
}

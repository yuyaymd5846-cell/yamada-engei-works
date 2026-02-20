
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const records = await prisma.workRecord.findMany({
            orderBy: { date: 'asc' } // Timeseries needs ascending order
        })

        // 1. Daily Trend Analysis (Stored by Date)
        // Structure: { date: '2024-02-20', '収穫': 5, '消毒': 2, total: 7 }
        const dailyTrendMap = new Map<string, any>()
        const workNames = new Set<string>()

        // 2. Work Distribution (Total Time per Work Name)
        const workDistributionMap = new Map<string, number>()

        // 3. Greenhouse Comparison (Total Time per Greenhouse)
        const greenhouseComparisonMap = new Map<string, number>()

        records.forEach(record => {
            const dateStr = record.date.toISOString().split('T')[0]
            workNames.add(record.workName)

            // Daily Trend
            if (!dailyTrendMap.has(dateStr)) {
                dailyTrendMap.set(dateStr, { date: dateStr })
            }
            const dayData = dailyTrendMap.get(dateStr)!
            dayData[record.workName] = (dayData[record.workName] || 0) + record.spentTime

            // Work Distribution
            const currentWorkTime = workDistributionMap.get(record.workName) || 0
            workDistributionMap.set(record.workName, currentWorkTime + record.spentTime)

            // Greenhouse Comparison
            const currentGhTime = greenhouseComparisonMap.get(record.greenhouseName) || 0
            greenhouseComparisonMap.set(record.greenhouseName, currentGhTime + record.spentTime)
        })

        // Format for Recharts
        const trendData = Array.from(dailyTrendMap.values())

        const workDistributionData = Array.from(workDistributionMap.entries()).map(([name, value]) => ({
            name,
            value
        })).sort((a, b) => b.value - a.value)

        const greenhouseComparisonData = Array.from(greenhouseComparisonMap.entries()).map(([name, value]) => ({
            name,
            value
        })).sort((a, b) => {
            const nameA = a.name.match(/\d+/)?.[0] || '0'
            const nameB = b.name.match(/\d+/)?.[0] || '0'
            return parseInt(nameA) - parseInt(nameB)
        })

        return NextResponse.json({
            trend: trendData,
            workNames: Array.from(workNames),
            workDistribution: workDistributionData,
            greenhouseComparison: greenhouseComparisonData,
            totalRecords: records.length
        })

    } catch (error) {
        console.error('Analysis API Error:', error)
        return NextResponse.json({ error: 'Failed to fetch analysis data' }, { status: 500 })
    }
}

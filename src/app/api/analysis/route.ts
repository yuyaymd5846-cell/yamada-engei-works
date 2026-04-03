
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const yearParam = searchParams.get('year')
        const ghParam = searchParams.get('gh')
        const batchParam = searchParams.get('batch')

        // 1. Get CropCycles to establish the "Harvest Year" mapping
        const hasYearFilter = !!(yearParam && /^\d{4}$/.test(yearParam))
        const cycleWhere = hasYearFilter
            ? {
                harvestStart: {
                    gte: new Date(Date.UTC(Number(yearParam), 0, 1, 0, 0, 0)),
                    lt: new Date(Date.UTC(Number(yearParam) + 1, 0, 1, 0, 0, 0))
                }
            }
            : undefined

        const allCycles = await prisma.cropCycle.findMany({
            where: cycleWhere,
            select: {
                greenhouseName: true,
                batchNumber: true,
                harvestStart: true,
            }
        })

        // Create lists of available options for the UI filters
        const availableYears = new Set<string>()
        const availableGreenhouses = new Set<string>()

        // Find the harvest year for each cycle
        allCycles.forEach(c => {
            if (c.harvestStart) {
                const year = new Date(c.harvestStart).getFullYear().toString()
                availableYears.add(year)
            }
            availableGreenhouses.add(c.greenhouseName)
        })

        const cycleKeySet = new Set(
            allCycles.map(c => `${c.greenhouseName}|${c.batchNumber ?? ''}`)
        )

        // 2. Fetch filtered WorkRecords (push down greenhouse/batch filters to DB)
        const allRecords = await prisma.workRecord.findMany({
            where: {
                ...(ghParam && ghParam !== 'ALL' ? { greenhouseName: ghParam } : {}),
                ...(batchParam && batchParam !== 'ALL' ? { batchNumber: Number(batchParam) } : {}),
            },
            select: {
                date: true,
                workName: true,
                greenhouseName: true,
                spentTime: true,
                batchNumber: true,
            },
            orderBy: { date: 'asc' }
        })

        const filteredRecords = allRecords.filter(record => {
            if (hasYearFilter) {
                const key = `${record.greenhouseName}|${record.batchNumber ?? ''}`
                if (!cycleKeySet.has(key)) return false
            }
            if (batchParam && batchParam !== 'ALL' && record.batchNumber?.toString() !== batchParam) {
                return false
            }
            return true
        })

        // 3. Aggregate Daily Trend Data
        const dailyTrendMap = new Map<string, any>()
        const workNames = new Set<string>()

        // 4. Aggregate Greenhouse Comparison (Total Time per Greenhouse)
        const greenhouseComparisonMap = new Map<string, number>()

        filteredRecords.forEach(record => {
            const dateStr = record.date.toISOString().split('T')[0]
            workNames.add(record.workName)

            // Daily Trend
            if (!dailyTrendMap.has(dateStr)) {
                dailyTrendMap.set(dateStr, { date: dateStr })
            }
            const dayData = dailyTrendMap.get(dateStr)!
            dayData[record.workName] = (dayData[record.workName] || 0) + record.spentTime

            // Greenhouse Comparison
            const currentGhTime = greenhouseComparisonMap.get(record.greenhouseName) || 0
            greenhouseComparisonMap.set(record.greenhouseName, currentGhTime + record.spentTime)
        })

        // Format for Recharts
        const trendData = Array.from(dailyTrendMap.values())

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
            greenhouseComparison: greenhouseComparisonData,
            totalRecords: filteredRecords.length,
            // Pass the filter options to the frontend
            filterOptions: {
                years: Array.from(availableYears).sort((a, b) => b.localeCompare(a)), // Descending
                greenhouses: Array.from(availableGreenhouses).sort()
            }
        })

    } catch (error) {
        console.error('Analysis API Error:', error)
        return NextResponse.json({ error: 'Failed to fetch analysis data' }, { status: 500 })
    }
}

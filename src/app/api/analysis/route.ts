
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const yearParam = searchParams.get('year')
        const ghParam = searchParams.get('gh')
        const batchParam = searchParams.get('batch')

        // 1. Get all CropCycles to establish the "Harvest Year" mapping
        const allCycles = await prisma.cropCycle.findMany()

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

        // 2. Fetch all WorkRecords (we'll filter them in-memory to ensure we correctly map to CropCycles)
        const allRecords = await prisma.workRecord.findMany({
            orderBy: { date: 'asc' }
        })

        const filteredRecords = allRecords.filter(record => {
            // Find the corresponding CropCycle for this record
            // Match by greenhouseName and batchNumber
            const cycle = allCycles.find(c =>
                c.greenhouseName === record.greenhouseName &&
                c.batchNumber === record.batchNumber
            )

            // If a year filter is applied, check the harvest year of the cycle
            if (yearParam) {
                if (!cycle || !cycle.harvestStart) return false
                const cycleYear = new Date(cycle.harvestStart).getFullYear().toString()
                if (cycleYear !== yearParam) return false
            }

            // If a greenhouse filter is applied
            if (ghParam && ghParam !== 'ALL' && record.greenhouseName !== ghParam) {
                return false
            }

            // If a batch filter is applied
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

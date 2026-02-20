
import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        // Optional: Filter by date range or greenhouse
        // const start = searchParams.get('start')

        const schedules = await prisma.cropSchedule.findMany({
            orderBy: { startDate: 'asc' }
        })
        return NextResponse.json(schedules)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { greenhouseId, greenhouseName, stage, startDate, endDate, color, batchNumber } = body

        if (!greenhouseId || !stage || !startDate) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const schedule = await prisma.cropSchedule.create({
            data: {
                greenhouseId,
                greenhouseName, // Normally derived from ID, but client can pass for now or we query it. 
                stage,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                color,
                batchNumber: batchNumber ? Number(batchNumber) : null
            }
        })
        return NextResponse.json(schedule)
    } catch (error) {
        console.error('Schedule creation error:', error)
        return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 })
    }
}

// For updating via Auto-hook or manual drag-and-drop later
export async function PUT(request: Request) {
    try {
        const body = await request.json()
        const { id, ...data } = body
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

        // Convert dates if present
        if (data.startDate) data.startDate = new Date(data.startDate)
        if (data.endDate) data.endDate = new Date(data.endDate)

        const updated = await prisma.cropSchedule.update({
            where: { id },
            data
        })
        return NextResponse.json(updated)
    } catch (error) {
        return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    }
}

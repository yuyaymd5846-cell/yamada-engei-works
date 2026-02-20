
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const cycles = await prisma.cropCycle.findMany({
            orderBy: { createdAt: 'desc' }
        })
        return NextResponse.json(cycles)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch crop cycles' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json()
        const { greenhouseId, greenhouseName, batchNumber, varieties, memo, disinfectionStart, disinfectionEnd, plantingDate, lightsOffDate, harvestStart, harvestEnd } = data

        const cycle = await prisma.cropCycle.create({
            data: {
                greenhouseId,
                greenhouseName,
                batchNumber: batchNumber ? Number(batchNumber) : null,
                varieties: varieties ? JSON.stringify(varieties) : null,
                memo,
                disinfectionStart: disinfectionStart ? new Date(disinfectionStart) : null,
                disinfectionEnd: disinfectionEnd ? new Date(disinfectionEnd) : null,
                plantingDate: plantingDate ? new Date(plantingDate) : null,
                lightsOffDate: lightsOffDate ? new Date(lightsOffDate) : null,
                harvestStart: harvestStart ? new Date(harvestStart) : null,
                harvestEnd: harvestEnd ? new Date(harvestEnd) : null,
            }
        })

        return NextResponse.json(cycle)
    } catch (error) {
        console.error('Crop cycle creation error:', error)
        return NextResponse.json({ error: 'Failed to create crop cycle' }, { status: 500 })
    }
}

export async function PATCH(request: Request) {
    try {
        const data = await request.json()
        const { id, varieties, memo, disinfectionStart, disinfectionEnd, plantingDate, lightsOffDate, harvestStart, harvestEnd, batchNumber } = data

        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

        const updated = await prisma.cropCycle.update({
            where: { id },
            data: {
                batchNumber: batchNumber !== undefined ? Number(batchNumber) : undefined,
                varieties: varieties !== undefined ? JSON.stringify(varieties) : undefined,
                memo: memo !== undefined ? memo : undefined,
                disinfectionStart: disinfectionStart !== undefined ? (disinfectionStart ? new Date(disinfectionStart) : null) : undefined,
                disinfectionEnd: disinfectionEnd !== undefined ? (disinfectionEnd ? new Date(disinfectionEnd) : null) : undefined,
                plantingDate: plantingDate !== undefined ? (plantingDate ? new Date(plantingDate) : null) : undefined,
                lightsOffDate: lightsOffDate !== undefined ? (lightsOffDate ? new Date(lightsOffDate) : null) : undefined,
                harvestStart: harvestStart !== undefined ? (harvestStart ? new Date(harvestStart) : null) : undefined,
                harvestEnd: harvestEnd !== undefined ? (harvestEnd ? new Date(harvestEnd) : null) : undefined,
            }
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error('Crop cycle update error:', error)
        return NextResponse.json({ error: 'Failed to update crop cycle' }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

        await prisma.cropCycle.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete crop cycle' }, { status: 500 })
    }
}

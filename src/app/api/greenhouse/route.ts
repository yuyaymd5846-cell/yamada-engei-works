
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const greenhouses = await prisma.greenhouse.findMany({
            orderBy: { name: 'asc' }
        })
        return NextResponse.json(greenhouses)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch greenhouses' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { name, areaAcre } = body

        if (!name || areaAcre === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const greenhouse = await prisma.greenhouse.create({
            data: {
                name,
                areaAcre: Number(areaAcre)
            }
        })
        return NextResponse.json(greenhouse)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create greenhouse' }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 })
        }

        await prisma.greenhouse.delete({
            where: { id }
        })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Delete error:', error)
        return NextResponse.json({ error: 'Failed to delete greenhouse' }, { status: 500 })
    }
}

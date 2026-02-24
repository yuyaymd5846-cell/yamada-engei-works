import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { orderedIds } = body

        if (!Array.isArray(orderedIds)) {
            return NextResponse.json({ error: 'orderedIds array is required' }, { status: 400 })
        }

        // Perform updates in a transaction to ensure all or nothing
        await prisma.$transaction(
            orderedIds.map((id: string, index: number) =>
                prisma.greenhouse.update({
                    where: { id },
                    data: { orderIndex: index }
                })
            )
        )

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Reorder error:', error)
        return NextResponse.json({ error: 'Failed to reorder greenhouses' }, { status: 500 })
    }
}

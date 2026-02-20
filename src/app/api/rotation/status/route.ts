
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const greenhouseName = searchParams.get('greenhouseName') || '全ハウス'

    try {
        const where: any = {
            workName: { contains: '薬剤散布' },
            greenhouseName: greenhouseName
        }

        const records = await prisma.workRecord.findMany({
            where,
            orderBy: { date: 'desc' }
        })

        // Map rotation labels (①-⑫) to their latest status
        const statusMap: Record<string, { date: string, id: string }> = {}
        const labels = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '⑪', '⑫']

        for (const record of records) {
            const note = record.note || ''
            for (const label of labels) {
                if (!statusMap[label] && note.includes(label)) {
                    statusMap[label] = {
                        date: record.date.toISOString(),
                        id: record.id
                    }
                }
            }
        }

        return NextResponse.json(statusMap)
    } catch (error) {
        console.error('Failed to fetch rotation status:', error)
        return NextResponse.json({ error: 'Failed to fetch rotation status' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { rotationLabel } = body

        if (!rotationLabel) {
            return NextResponse.json({ error: 'Missing rotation label' }, { status: 400 })
        }

        const record = await prisma.workRecord.create({
            data: {
                workName: '薬剤散布',
                greenhouseName: '全ハウス',
                areaAcre: 0,
                spentTime: 0,
                note: `${rotationLabel} ローテーション実施`,
                date: new Date()
            }
        })

        return NextResponse.json(record)
    } catch (error) {
        console.error('Failed to record rotation:', error)
        return NextResponse.json({ error: 'Failed to record rotation' }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 })
        }

        await prisma.workRecord.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to delete rotation record:', error)
        return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 })
    }
}

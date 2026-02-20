
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const stage = searchParams.get('stage')
    const sort = searchParams.get('sort')

    let orderBy = {}
    if (sort === 'profit_desc') {
        // Note: impactOnProfit is a string description in current schema, so sorting might be limited.
        // Ideally we'd have a numeric value for profit impact. For now, we return default order or just rely on stage.
        // If user wants specific sort, we might need a numeric field or just sort by updatedAt.
        orderBy = { updatedAt: 'desc' }
    } else if (sort === 'risk_desc') {
        orderBy = { updatedAt: 'desc' } // Placeholder logic
    } else {
        orderBy = { workName: 'asc' }
    }

    const where = stage ? { stage: { contains: stage } } : {}

    try {
        const works = await prisma.workManual.findMany({
            where,
            orderBy,
        })
        return NextResponse.json(works)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const {
            workName,
            stage,
            purpose,
            timingStandard,
            actionSteps,
            riskIfNotDone,
            impactOnQuality,
            impactOnYield,
            impactOnProfit,
            requiredTime10a,
            difficultyLevel,
            imageUrl,
            videoUrl
        } = body

        const newWork = await prisma.workManual.create({
            data: {
                workName,
                stage,
                purpose,
                timingStandard,
                actionSteps,
                riskIfNotDone,
                impactOnQuality: impactOnQuality || '品質への影響大',
                impactOnYield: impactOnYield || '歩留まり低下の恐れ',
                impactOnProfit,
                inputParameters: JSON.stringify({}), // Default
                requiredTime10a: Number(requiredTime10a),
                difficultyLevel: Number(difficultyLevel),
                imageUrl,
                videoUrl
            }
        })

        return NextResponse.json(newWork)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Failed to create work manual' }, { status: 500 })
    }
}


import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

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

        const updatedWork = await prisma.workManual.update({
            where: { id },
            data: {
                workName,
                stage,
                purpose,
                timingStandard,
                actionSteps,
                riskIfNotDone,
                impactOnQuality,
                impactOnYield,
                impactOnProfit,
                requiredTime10a: Number(requiredTime10a),
                difficultyLevel: Number(difficultyLevel),
                imageUrl,
                videoUrl
            }
        })

        // Automaticaly sync schedules if it's Parent Stock Management
        if (updatedWork.workName === '親株管理') {
            const { syncParentStockManualToSchedule } = await import('@/lib/parent-stock-sync');
            await syncParentStockManualToSchedule(updatedWork.actionSteps);
        }

        return NextResponse.json(updatedWork)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Failed to update work manual' }, { status: 500 })
    }
}

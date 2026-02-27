import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkGptAuth } from '@/lib/gptAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    if (!checkGptAuth(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const greenhouses = await prisma.greenhouse.findMany({
            orderBy: { orderIndex: 'asc' }
        });

        const statusList = [];

        for (const gh of greenhouses) {
            // Get the latest crop cycle
            const latestCycle = await prisma.cropCycle.findFirst({
                where: { greenhouseId: gh.id },
                orderBy: { createdAt: 'desc' }
            });

            // Get recent and upcoming schedules (last 14 days and future)
            const now = new Date();
            const pastTwoWeeks = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

            const schedules = await prisma.cropSchedule.findMany({
                where: {
                    greenhouseId: gh.id,
                    startDate: { gte: pastTwoWeeks }
                },
                orderBy: { startDate: 'asc' },
                take: 5
            });

            statusList.push({
                greenhouse: {
                    id: gh.id,
                    name: gh.name,
                    areaAcre: gh.areaAcre,
                    pesticideRotationIndex: gh.pesticideRotationIndex,
                },
                activeCycle: latestCycle ? {
                    batchNumber: latestCycle.batchNumber,
                    isParentStock: latestCycle.isParentStock,
                    varieties: latestCycle.varieties ? JSON.parse(latestCycle.varieties) : null,
                    plantingDate: latestCycle.plantingDate,
                    harvestStart: latestCycle.harvestStart,
                    harvestEnd: latestCycle.harvestEnd,
                } : null,
                recentSchedules: schedules.map(s => ({
                    stage: s.stage,
                    startDate: s.startDate,
                    endDate: s.endDate,
                })),
            });
        }

        return NextResponse.json({ success: true, data: statusList });
    } catch (error) {
        console.error('Error fetching status for GPT:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

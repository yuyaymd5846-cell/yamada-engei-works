import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkGptAuth } from '@/lib/gptAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    if (!checkGptAuth(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const now = new Date();
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        const endOfDay = new Date(now.setHours(23, 59, 59, 999));

        // Find currently active schedules
        const activeSchedules = await prisma.cropSchedule.findMany({
            where: {
                AND: [
                    { startDate: { lte: endOfDay } },
                    { OR: [{ endDate: null }, { endDate: { gte: startOfDay } }] }
                ]
            },
            orderBy: { startDate: 'asc' }
        });

        const greenhouses = await prisma.greenhouse.findMany({
            orderBy: { orderIndex: 'asc' }
        });
        const rotations = await prisma.pesticideRotation.findMany({
            orderBy: { createdAt: 'asc' }
        });

        const recommendations = greenhouses.map(gh => {
            // Logic from pesticide rotation system: 
            // The frontend uses the index (1-based) to get the active rotation
            const activeRotation = rotations[gh.pesticideRotationIndex - 1] || null;

            const ghSchedules = activeSchedules.filter(s => s.greenhouseId === gh.id);

            return {
                greenhouseId: gh.id,
                greenhouseName: gh.name,
                todayTasks: ghSchedules.map(s => s.stage),
                nextPesticideRotation: activeRotation ? {
                    label: activeRotation.label,
                    pesticides: JSON.parse(activeRotation.pesticides)
                } : null
            };
        });

        return NextResponse.json({ success: true, data: recommendations });
    } catch (error) {
        console.error('Error fetching recommendations for GPT:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

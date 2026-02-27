import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkGptAuth } from '@/lib/gptAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    if (!checkGptAuth(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const greenhouseName = searchParams.get('greenhouseName');

    try {
        let greenhouseMatch = null;
        if (greenhouseName) {
            greenhouseMatch = await prisma.greenhouse.findFirst({
                where: { name: { contains: greenhouseName } }
            });
        }

        const recentRecords = await prisma.workRecord.findMany({
            where: greenhouseMatch ? { greenhouseName: greenhouseMatch.name } : undefined,
            orderBy: { date: 'desc' },
            take: 20
        });

        const recentCycles = await prisma.cropCycle.findMany({
            where: greenhouseMatch ? { greenhouseId: greenhouseMatch.id } : undefined,
            orderBy: { plantingDate: 'desc' },
            take: 5
        });

        // Summarize records to avoid going over GPT token limits
        const formattedRecords = recentRecords.map(r => ({
            date: r.date.toISOString().split('T')[0],
            workName: r.workName,
            greenhouseName: r.greenhouseName,
            spentTime: r.spentTime,
            note: r.note ? r.note.substring(0, 100) : "", // Truncate long notes
        }));

        return NextResponse.json({
            success: true,
            data: {
                recentRecords: formattedRecords,
                recentCycles: recentCycles.map(c => ({
                    greenhouseName: c.greenhouseName,
                    batchNumber: c.batchNumber,
                    plantingDate: c.plantingDate,
                    harvestStart: c.harvestStart,
                    harvestEnd: c.harvestEnd,
                }))
            }
        });
    } catch (error) {
        console.error('Error fetching analysis data for GPT:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

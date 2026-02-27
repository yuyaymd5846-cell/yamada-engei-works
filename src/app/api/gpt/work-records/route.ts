import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkGptAuth } from '@/lib/gptAuth';

export async function POST(request: NextRequest) {
    if (!checkGptAuth(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { workName, greenhouseName, spentTime, note, workerName } = body;

        if (!workName || !greenhouseName || typeof spentTime !== 'number') {
            return NextResponse.json(
                { error: 'Missing required fields: workName, greenhouseName, spentTime' },
                { status: 400 }
            );
        }

        // Find the greenhouse to auto-fill areaAcre
        const greenhouse = await prisma.greenhouse.findFirst({
            where: { name: greenhouseName }
        });

        if (!greenhouse) {
            return NextResponse.json(
                { error: `Greenhouse not found: ${greenhouseName}` },
                { status: 404 }
            );
        }

        // Get active cycle to auto-fill batchNumber
        const cycle = await prisma.cropCycle.findFirst({
            where: { greenhouseId: greenhouse.id },
            orderBy: { createdAt: 'desc' }
        });

        const record = await prisma.workRecord.create({
            data: {
                workName,
                greenhouseName: greenhouse.name,
                spentTime,
                note,
                workerName: workerName || "GPT Assistant",
                areaAcre: greenhouse.areaAcre,
                batchNumber: cycle?.batchNumber || null,
                date: new Date(),
            }
        });

        return NextResponse.json({ success: true, data: record });
    } catch (error) {
        console.error('Error creating work record for GPT:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

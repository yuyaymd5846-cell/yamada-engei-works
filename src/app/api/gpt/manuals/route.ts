import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkGptAuth } from '@/lib/gptAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    if (!checkGptAuth(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    try {
        let manuals;
        if (query) {
            manuals = await prisma.workManual.findMany({
                where: {
                    OR: [
                        { workName: { contains: query } },
                        { purpose: { contains: query } },
                        { stage: { contains: query } }
                    ]
                },
                take: 5, // Limit results for readability in GPT
            });
        } else {
            manuals = await prisma.workManual.findMany({ take: 5 });
        }

        const formattedManuals = manuals.map(m => ({
            workName: m.workName,
            stage: m.stage,
            purpose: m.purpose,
            timingStandard: m.timingStandard,
            actionSteps: m.actionSteps,
            riskIfNotDone: m.riskIfNotDone,
            difficultyLevel: m.difficultyLevel,
            requiredTime10a: m.requiredTime10a,
        }));

        return NextResponse.json({ success: true, data: formattedManuals });
    } catch (error) {
        console.error('Error fetching manuals for GPT:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

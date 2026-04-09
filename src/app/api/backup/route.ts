import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const [manuals, greenhouses, records, cycles, schedules, rotations, diagnoses] = await Promise.all([
            prisma.workManual.findMany({ orderBy: { updatedAt: 'desc' } }),
            prisma.greenhouse.findMany({ orderBy: { orderIndex: 'asc' } }),
            prisma.workRecord.findMany({ orderBy: { date: 'desc' } }),
            prisma.cropCycle.findMany({ orderBy: { createdAt: 'desc' } }),
            prisma.cropSchedule.findMany({ orderBy: { startDate: 'asc' } }),
            prisma.pesticideRotation.findMany({ orderBy: { createdAt: 'asc' } }),
            prisma.buddingDiagnosis.findMany({ orderBy: { createdAt: 'desc' } }),
        ])

        const exportedAt = new Date()
        const payload = {
            exportedAt: exportedAt.toISOString(),
            manuals,
            greenhouses,
            records,
            cycles,
            schedules,
            rotations,
            diagnoses,
        }

        return new NextResponse(JSON.stringify(payload, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Content-Disposition': `attachment; filename="yamada-engei-backup-${exportedAt.toISOString().slice(0, 10)}.json"`,
            },
        })
    } catch (error) {
        console.error('Backup export error:', error)
        return NextResponse.json({ error: 'Failed to export backup data' }, { status: 500 })
    }
}

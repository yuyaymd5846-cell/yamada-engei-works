import prisma from '@/lib/prisma'

type SyncableCycle = {
    greenhouseId: string
    greenhouseName: string
    batchNumber: number | null
    isParentStock: boolean
    disinfectionStart: Date | null
    disinfectionEnd: Date | null
    plantingDate: Date | null
    lightsOffDate: Date | null
    harvestStart: Date | null
    harvestEnd: Date | null
    pinchingDate: Date | null
    cuttingsStart: Date | null
    cleanupDate: Date | null
}

type ScheduleSeed = {
    greenhouseId: string
    greenhouseName: string
    batchNumber: number | null
    stage: string
    startDate: Date
    endDate: Date | null
    color: string
}

function addSchedule(
    schedules: ScheduleSeed[],
    cycle: SyncableCycle,
    stage: string,
    startDate: Date | null,
    endDate: Date | null,
    color: string
) {
    if (!startDate) return

    schedules.push({
        greenhouseId: cycle.greenhouseId,
        greenhouseName: cycle.greenhouseName,
        batchNumber: cycle.batchNumber,
        stage,
        startDate,
        endDate,
        color,
    })
}

function toSchedules(cycle: SyncableCycle): ScheduleSeed[] {
    const schedules: ScheduleSeed[] = []

    addSchedule(schedules, cycle, '豸域ｯ・', cycle.disinfectionStart, cycle.disinfectionEnd, '#adb5bd')

    if (cycle.isParentStock) {
        addSchedule(schedules, cycle, '螳壽､阪懈ｶ育・', cycle.plantingDate, cycle.pinchingDate, '#4caf50')
        addSchedule(schedules, cycle, '鞫倩官', cycle.pinchingDate, cycle.cuttingsStart, '#fd7e14')
        addSchedule(schedules, cycle, '謗｡遨・', cycle.cuttingsStart, cycle.cleanupDate, '#ffc107')
        return schedules
    }

    addSchedule(schedules, cycle, '螳壽､阪懈ｶ育・', cycle.plantingDate, cycle.lightsOffDate, '#4caf50')
    addSchedule(schedules, cycle, '豸育・縲懷庶遨ｫ', cycle.lightsOffDate, cycle.harvestStart, '#2196f3')
    addSchedule(schedules, cycle, '蜿守ｩｫ', cycle.harvestStart, cycle.harvestEnd, '#ffc107')

    return schedules
}

export async function syncCropSchedulesForGreenhouse(greenhouseId: string) {
    const cycles = await prisma.cropCycle.findMany({
        where: { greenhouseId },
        orderBy: { createdAt: 'asc' },
    })

    const schedules = cycles.flatMap((cycle) => toSchedules(cycle))

    await prisma.$transaction([
        prisma.cropSchedule.deleteMany({ where: { greenhouseId } }),
        ...(schedules.length > 0
            ? schedules.map((schedule) => prisma.cropSchedule.create({ data: schedule }))
            : []),
    ])
}

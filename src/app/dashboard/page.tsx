

import prisma from '@/lib/prisma'
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import styles from './dashboard.module.css'
import QuickRecordForm from './QuickRecordForm'


interface WorkTarget {
    manual: any
    displayWorkName?: string
    targets: {
        greenhouseId: string
        greenhouseName: string
        areaAcre: number
        targetTime: number
        lastBatchNumber: number | null
    }[]
    targetTotalTime: number
    actualTime: number
    requiredTime10a: number
    isCompleted: boolean
}

async function getTodaysWork() {
    const now = new Date()
    const jstFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Tokyo',
        year: 'numeric', month: 'numeric', day: 'numeric',
    })
    const parts = jstFormatter.formatToParts(now)
    const year = parseInt(parts.find(p => p.type === 'year')!.value)
    const month = parseInt(parts.find(p => p.type === 'month')!.value) - 1
    const day = parseInt(parts.find(p => p.type === 'day')!.value)

    // JST Boundaries for WorkRecords created at "now" (UTC 15:00 prev day to 14:59:59 today)
    const todayStartJST = new Date(Date.UTC(year, month, day - 1, 15, 0, 0, 0))
    const todayEndJST = new Date(Date.UTC(year, month, day, 14, 59, 59, 999))

    // Abstract JST date normalized to UTC midnight for comparing with stored cycle dates
    const todayUTC = new Date(Date.UTC(year, month, day))

    // 1. Get all active crop cycles
    const activeCycles = await prisma.cropCycle.findMany({
        where: {
            OR: [
                { harvestEnd: null },
                { harvestEnd: { gte: todayUTC } }
            ]
        }
    })

    // 2. Get today's work records to calculate total actual time for each work type
    const todaysRecords = await prisma.workRecord.findMany({
        where: {
            date: {
                gte: todayStartJST,
                lte: todayEndJST,
            }
        }
    })

    // Map to store total actual time (minutes) per work name
    const actualTimeMap = new Map<string, number>()
    todaysRecords.forEach(record => {
        // Handle potential appended greenhouse names for backward compatibility
        const baseName = record.workName.split(' (')[0]
        const current = actualTimeMap.get(baseName) || 0
        actualTimeMap.set(baseName, current + record.spentTime)
    })

    // 3. Get active schedules from Gantt chart to refine visibility
    const activeSchedules = await prisma.cropSchedule.findMany({
        where: {
            startDate: { lte: todayUTC },
            OR: [
                { endDate: null },
                { endDate: { gte: todayUTC } }
            ]
        }
    })
    const harvestingGreenhouseIds = new Set(
        activeSchedules
            .filter(s => s.stage === '収穫' || s.stage === '収穫期')
            .map(s => s.greenhouseId)
    )

    // 4. Get all work manuals for standard times and qualitative targets
    const manuals = await prisma.workManual.findMany()
    const manualMap = new Map(manuals.map(m => [m.workName, m]))

    // 5. Calculate suggestions based on cycle phase
    const suggestions = new Map<string, string[]>()
    const addTarget = (workName: string, greenhouseId: string) => {
        const existing = suggestions.get(workName) || []
        if (!existing.includes(greenhouseId)) {
            suggestions.set(workName, [...existing, greenhouseId])
        }
    }

    for (const cycle of activeCycles) {
        const pDate = cycle.plantingDate ? new Date(cycle.plantingDate) : null
        if (pDate) pDate.setHours(0, 0, 0, 0) // Normalize to start of day

        const hStart = cycle.harvestStart ? new Date(cycle.harvestStart) : null
        if (hStart) hStart.setHours(0, 0, 0, 0)

        const hEnd = cycle.harvestEnd ? new Date(cycle.harvestEnd) : null
        if (hEnd) hEnd.setHours(0, 0, 0, 0)

        const loDate = cycle.lightsOffDate ? new Date(cycle.lightsOffDate) : null
        if (loDate) loDate.setHours(0, 0, 0, 0)

        // 1. 定植 (Planting day)
        if (pDate && todayUTC.getTime() === pDate.getTime()) {
            addTarget('定植', cycle.greenhouseId)
            addTarget('杭打ち', cycle.greenhouseId) // Assuming 杭打ち is also on planting day
        }

        // 2. 圃場準備 (Day before planting)
        if (pDate) {
            const yesterdayOfPlanting = new Date(pDate)
            yesterdayOfPlanting.setDate(pDate.getDate() - 1)
            if (todayUTC.getTime() === yesterdayOfPlanting.getTime()) {
                addTarget('圃場準備', cycle.greenhouseId)
            }
        }

        // 3. 収穫・出荷調整・出荷 (During harvest period)
        if (hStart && hEnd && todayUTC >= hStart && todayUTC <= hEnd) {
            addTarget('収穫', cycle.greenhouseId)
            addTarget('出荷調整（手作業）', cycle.greenhouseId)
            addTarget('出荷', cycle.greenhouseId)
        }

        // 4. 片付け (On last day of harvest)
        if (hEnd && todayUTC.getTime() === hEnd.getTime()) {
            addTarget('片付け', cycle.greenhouseId)
        }

        // 5. 発蕾確認 (20-22 days after lightsOffDate)
        if (loDate) {
            const diffDays = Math.floor((todayUTC.getTime() - loDate.getTime()) / (1000 * 60 * 60 * 24))
            if (diffDays >= 20 && diffDays <= 22) {
                addTarget('発蕾確認', cycle.greenhouseId)
            }
        }

        // 6. ヤゴかき (35-45 days after lightsOffDate)
        if (loDate) {
            const diffDays = Math.floor((todayUTC.getTime() - loDate.getTime()) / (1000 * 60 * 60 * 24))
            if (diffDays >= 35 && diffDays <= 45) {
                addTarget('ヤゴかき', cycle.greenhouseId)
            }
        }

        // 7. 頂花取り (40-45 days after lightsOffDate)
        if (loDate) {
            const diffDays = Math.floor((todayUTC.getTime() - loDate.getTime()) / (1000 * 60 * 60 * 24))
            if (diffDays >= 40 && diffDays <= 45) {
                addTarget('頂花取り', cycle.greenhouseId)
            }
        }

        // 8. 消灯 (On lightsOffDate)
        // Hide if harvest has started in Gantt chart
        if (loDate && !harvestingGreenhouseIds.has(cycle.greenhouseId)) {
            if (todayUTC.getTime() === loDate.getTime()) {
                addTarget('消灯', cycle.greenhouseId)
            }
        }

        // 9. 施肥 (Day before plantingDate)
        if (pDate) {
            const yesterdayOfPlanting = new Date(pDate)
            yesterdayOfPlanting.setDate(pDate.getDate() - 1)
            if (todayUTC.getTime() === yesterdayOfPlanting.getTime()) {
                addTarget('施肥', cycle.greenhouseId)
            }
        }

        // 10. ハダニ特別防除 (May 20th - Oct 31st, 35-40 days after lightsOffDate)
        const monthFilter = todayUTC.getMonth() + 1 // 1-12
        const dayFilter = todayUTC.getDate()
        const isTargetSeason = (monthFilter === 5 && dayFilter >= 20) || (monthFilter > 5 && monthFilter <= 10)

        if (isTargetSeason && loDate) {
            const diffDays = Math.floor((todayUTC.getTime() - loDate.getTime()) / (1000 * 60 * 60 * 24))
            if (diffDays >= 35 && diffDays <= 40) {
                addTarget('ハダニ特別防除', cycle.greenhouseId)
            }
        }
    }

    // Always suggest "採穂", "かん水", "栽培管理" and "薬剤散布" as routine
    if (manualMap.has('採穂')) suggestions.set('採穂', suggestions.get('採穂') || [])
    if (manualMap.has('かん水')) suggestions.set('かん水', suggestions.get('かん水') || [])
    if (manualMap.has('栽培管理')) suggestions.set('栽培管理', suggestions.get('栽培管理') || [])
    if (manualMap.has('薬剤散布')) suggestions.set('薬剤散布', suggestions.get('薬剤散布') || [])


    // Convert map to array of WorkTarget
    const finalResults: WorkTarget[] = []

    // We want to preserve the specific order for routine tasks: かん水 -> 栽培管理 -> 薬剤散布
    const routineOrder = ['かん水', '栽培管理', '薬剤散布']
    const allWorkNames = Array.from(suggestions.keys())

    // Sort work names: non-routine first, then routine in order
    allWorkNames.sort((a, b) => {
        const aIndex = routineOrder.indexOf(a)
        const bIndex = routineOrder.indexOf(b)

        if (aIndex === -1 && bIndex === -1) return 0 // Both non-routine, maintain original order
        if (aIndex === -1) return -1 // a is non-routine, comes before b (routine)
        if (bIndex === -1) return 1 // b is non-routine, a (routine) comes after b
        return aIndex - bIndex // Both routine, sort by routineOrder
    })

    const allGreenhouses = await prisma.greenhouse.findMany()
    const greenhouseMap = new Map(allGreenhouses.map(g => [g.id, g]))

    // NEW: Fetch latest batch number for each greenhouse to pre-fill forms
    const latestRecords = await prisma.workRecord.findMany({
        orderBy: { date: 'desc' },
        distinct: ['greenhouseName'],
        select: { greenhouseName: true, batchNumber: true }
    })
    const lastBatchMap = new Map(latestRecords.map(r => [r.greenhouseName, r.batchNumber]))

    for (const workName of allWorkNames) {
        const ghIds = suggestions.get(workName) || []
        const manual = manualMap.get(workName)
        const totalActualTimeForWork = actualTimeMap.get(workName) || 0

        if (manual) {
            // Special handling: Split into individual cards for Harvest and Shipping tasks
            const tasksToSplit = ['収穫', '出荷調整（手作業）', '出荷']
            if (tasksToSplit.includes(workName)) {
                const effectiveHouses = ghIds.length > 0 ? ghIds : []

                for (const ghId of effectiveHouses) {
                    const greenhouse = greenhouseMap.get(ghId)
                    if (greenhouse) {
                        // Calculate actual time SPECIFIC to this house for this task
                        const thisHouseRecords = todaysRecords.filter(r =>
                            (r.workName === workName || r.workName.startsWith(workName)) &&
                            (r.greenhouseName === greenhouse.name)
                        )
                        const thisHouseActualTime = thisHouseRecords.reduce((sum, r) => sum + r.spentTime, 0)

                        const lastBatchNumber = lastBatchMap.get(greenhouse.name) || null

                        // Create a specific target object
                        const singleTarget = {
                            greenhouseId: ghId,
                            greenhouseName: greenhouse.name,
                            areaAcre: greenhouse.areaAcre,
                            targetTime: 0, // No target time for split tasks
                            lastBatchNumber
                        }

                        // Clone manual to modify display name
                        // For Shipping Adjustment, we'll shorten the name slightly for the card title
                        let displayName = workName
                        if (workName === '出荷調整（手作業）') displayName = '出荷調整'

                        finalResults.push({
                            manual,
                            displayWorkName: `${displayName} (${greenhouse.name})`,
                            targets: [singleTarget],
                            targetTotalTime: 0,
                            actualTime: thisHouseActualTime,
                            requiredTime10a: 0,
                            isCompleted: thisHouseActualTime > 0
                        })
                    }
                }
            } else {
                // Standard Logic for other tasks (Grouped)
                const targets: { greenhouseId: string, greenhouseName: string, areaAcre: number, targetTime: number, lastBatchNumber: number | null }[] = []
                let targetTotalTime = 0

                // If it's a routine task with no specific house targeted yet, consider all houses
                const effectiveHouses = ghIds.length > 0 ? ghIds : allGreenhouses.map(g => g.id)

                // Pre-calculate groups for Irrigation and Pesticide Spraying proration
                const perHouseGroups = new Map<string, number>()
                if (workName === 'かん水' || workName === '薬剤散布') {
                    allGreenhouses.forEach(g => {
                        const prefix = g.name.split('-')[0] // Group by prefix (e.g. "⑧" from "⑧-1")
                        perHouseGroups.set(prefix, (perHouseGroups.get(prefix) || 0) + g.areaAcre)
                    })
                }

                for (const ghId of effectiveHouses) {
                    const greenhouse = greenhouseMap.get(ghId)
                    if (greenhouse) {
                        const timeVal = manual.requiredTime10a || 0
                        let targetTime = 0

                        if (workName === 'かん水' || workName === '薬剤散布') {
                            // "Irrigation" and "Pesticide Spraying": timeVal is treated as "Time per House (Group)"
                            // Prorate based on area within the group
                            const prefix = greenhouse.name.split('-')[0]
                            const groupTotalArea = perHouseGroups.get(prefix) || greenhouse.areaAcre
                            const ratio = greenhouse.areaAcre / groupTotalArea
                            targetTime = timeVal * ratio
                        } else {
                            // Standard: timeVal is "Time per 10a"
                            targetTime = (greenhouse.areaAcre / 10) * timeVal
                        }

                        const lastBatchNumber = lastBatchMap.get(greenhouse.name) || null
                        targets.push({
                            greenhouseId: ghId,
                            greenhouseName: greenhouse.name,
                            areaAcre: greenhouse.areaAcre,
                            targetTime,
                            lastBatchNumber
                        })
                        targetTotalTime += targetTime
                    }
                }

                finalResults.push({
                    manual,
                    targets,
                    targetTotalTime,
                    actualTime: totalActualTimeForWork, // Total for this work type
                    requiredTime10a: manual.requiredTime10a || 0,
                    isCompleted: totalActualTimeForWork > 0
                })
            }
        }
    }

    // Finally sort to move completed tasks to the end
    return finalResults.sort((a, b) => {
        if (a.isCompleted === b.isCompleted) return 0
        return a.isCompleted ? 1 : -1
    })
}

async function getRiskAlerts() {
    return await prisma.workManual.findMany({
        where: {
            riskIfNotDone: { contains: '全滅' }
        },
        take: 2
    })
}

export default async function DashboardPage() {
    const todaysWorkTargets = await getTodaysWork()
    const riskAlerts = await getRiskAlerts()

    return (
        <div className={styles.dashboard}>
            <h1 className={styles.pageTitle}>ダッシュボード</h1>
            <div className={styles.dateDisplay}>
                {new Intl.DateTimeFormat('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'short'
                }).format(new Date())}
            </div>
            {riskAlerts.length > 0 && (
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle} style={{ color: 'var(--color-danger)' }}>
                        ⚠️ リスクアラート
                    </h2>
                    <div className={styles.cardGrid}>
                        {riskAlerts.map(work => (
                            <div key={work.id} className={`${styles.card} ${styles.cardDanger}`}>
                                <h3>{work.workName}</h3>
                                <p><strong>リスク:</strong> {work.riskIfNotDone}</p>
                                <div className={styles.actions}>
                                    <Link href={`/work/${work.id}`} className={styles.button}>詳細確認</Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>今日の作業候補</h2>
                <div className={styles.suggestionsGrid}>
                    {todaysWorkTargets.map((wt, i) => (
                        <div key={i} className={`${styles.workCard} ${wt.isCompleted ? styles.completedCard : ''}`}>
                            <div className={styles.cardHeader}>
                                <div className={styles.workTitleRow}>
                                    <h3 className={styles.workName}>{wt.displayWorkName || wt.manual.workName}</h3>
                                    {wt.isCompleted && (
                                        <span className={styles.completedBadge}>✅ 完了</span>
                                    )}
                                </div>
                                <span className={styles.stageLabel}>{wt.manual.stage}</span>
                            </div>
                            <p className={styles.purpose}>{wt.manual.purpose}</p>

                            <div className={styles.manualTarget}>
                                <span className={styles.targetIcon}>🎯</span>
                                <span className={styles.targetLabel}>目標:</span>
                                <span className={styles.targetText}>{wt.manual.timingStandard}</span>
                            </div>

                            <div className={styles.targetComparison}>
                                <div className={styles.targetBox}>
                                    <span className={styles.subText}>目標合計: {wt.targetTotalTime > 0 ? `${wt.targetTotalTime.toFixed(2)}h` : '-'}</span>
                                </div>
                                <div className={styles.targetBox}>
                                    <span className={styles.subText}>本日の実績: </span>
                                    <span className={styles.actualTotal} data-complete={wt.isCompleted}>
                                        {wt.actualTime.toFixed(2)}h
                                    </span>
                                </div>
                            </div>

                            {wt.targets.length > 0 && (
                                <div className={styles.targetsList}>
                                    {wt.targets.map((t: any, idx) => (
                                        <div key={idx} className={styles.targetBadge}>
                                            <span className={styles.targetGH}>{t.greenhouseName}</span>
                                            <span className={styles.targetTimeValue}>{t.targetTime.toFixed(2)}h</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className={styles.cardFooter}>
                                <div className={styles.footerInfo}>
                                    <span className={styles.standardTime}>
                                        目安: {wt.manual.requiredTime10a}h/{(wt.manual.workName === 'かん水' || wt.manual.workName === '薬剤散布') ? '棟' : '10a'}
                                    </span>
                                    <Link href={`/work/${wt.manual.id}`} className={styles.link}>手順を見る</Link>
                                </div>
                                <QuickRecordForm
                                    workName={wt.manual.workName}
                                    suggestedGreenhouses={wt.targets.map((t: any) => ({
                                        id: t.greenhouseId,
                                        name: t.greenhouseName,
                                        areaAcre: t.areaAcre,
                                        lastBatchNumber: t.lastBatchNumber
                                    }))}
                                    defaultTime10a={wt.manual.requiredTime10a}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </section>


            <div className={styles.quickLinks}>
                <Link href="/search" className={styles.bigButton}>
                    全ての作業マニュアルを検索
                </Link>
            </div>
        </div>
    )
}

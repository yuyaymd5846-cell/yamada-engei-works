

import prisma from '@/lib/prisma'
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import styles from './dashboard.module.css'
import QuickRecordForm from './QuickRecordForm'
import DashboardWorkCard from './DashboardWorkCard'


interface ManualData {
    id: string
    workName: string
    stage: string
    purpose: string
    timingStandard: string
    requiredTime10a: number
}

interface TargetItem {
    greenhouseId: string
    greenhouseName: string
    areaAcre: number
    targetTime: number
    lastBatchNumber: number | null
    isUrgent?: boolean
    daysPassed?: number
}

interface WorkTarget {
    manual: ManualData
    displayWorkName?: string
    targets: TargetItem[]
    targetTotalTime: number
    actualTime: number
    requiredTime10a: number
    isCompleted: boolean
    hasUrgentTarget?: boolean
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

    // 2.5 Get ALL historical records for one-time tasks to hide them if already done in the past
    // Focusing on specific one-time tasks: 発蕾確認, ヤゴかき, 頂花取り
    const oneTimeTasks = ['発蕾確認', 'ヤゴかき', '頂花取り', '杭打ち', '圃場準備', '施肥', 'ハダニ特別防除', '片付け']
    const historyRecords = await prisma.workRecord.findMany({
        where: {
            workName: { in: oneTimeTasks },
            date: { lt: todayStartJST } // Only records BEFORE today
        }
    })

    // Create a set for quick lookup: "WorkName|GreenhouseName|BatchNumber"
    const completedHistory = new Set<string>()
    historyRecords.forEach(r => {
        const key = `${r.workName}|${r.greenhouseName}|${r.batchNumber || ''}`
        completedHistory.add(key)
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

    // 3.5 Prepare maps for greenhouse lookup and batch numbers
    const allGreenhouses = await prisma.greenhouse.findMany()
    const greenhouseMap = new Map(allGreenhouses.map(g => [g.id, g]))

    const cycleBatchMap = new Map<string, number | null>()
    for (const cycle of activeCycles) {
        // Use the most relevant active cycle per greenhouse (latest planting date takes precedence)
        const existing = cycleBatchMap.get(cycle.greenhouseId)
        if (existing === undefined) {
            cycleBatchMap.set(cycle.greenhouseId, cycle.batchNumber)
        }
    }

    // 4. Get all work manuals for standard times and qualitative targets
    const manuals = await prisma.workManual.findMany()
    const manualMap = new Map(manuals.map(m => [m.workName, m]))

    // 4.5. Get recent pesticide records to calculate days passed
    const recentPesticides = await prisma.workRecord.findMany({
        where: { workName: '薬剤散布' },
        orderBy: { date: 'desc' },
        // Fetch enough to cover all greenhouses recently
        take: 100
    })
    const lastPesticideDateMap = new Map<string, Date>()
    for (const record of recentPesticides) {
        if (!lastPesticideDateMap.has(record.greenhouseName)) {
            lastPesticideDateMap.set(record.greenhouseName, record.date)
        }
    }

    // 5. Calculate suggestions based on cycle phase
    const suggestions = new Map<string, string[]>()
    const addTarget = (workName: string, greenhouseId: string) => {
        const greenhouse = greenhouseMap.get(greenhouseId)
        const batchNumber = cycleBatchMap.get(greenhouseId)

        // If it's a one-time task, check if it was ALREADY completed in history
        if (oneTimeTasks.includes(workName) && greenhouse) {
            const historyKey = `${workName}|${greenhouse.name}|${batchNumber || ''}`
            if (completedHistory.has(historyKey)) {
                // Already done in the past, skip adding to today's suggestions
                return
            }
        }

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

        // 11. ビーナイン散布（B9） (0, 7, 14, 21 days after lightsOffDate)
        if (loDate) {
            const diffDays = Math.floor((todayUTC.getTime() - loDate.getTime()) / (1000 * 60 * 60 * 24))
            if ([0, 7, 14, 21].includes(diffDays)) {
                addTarget('ビーナイン散布（B9）', cycle.greenhouseId)
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

    // Maps already prepared above

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

                        const lastBatchNumber = cycleBatchMap.get(ghId) ?? null

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
                const targets: { greenhouseId: string, greenhouseName: string, areaAcre: number, targetTime: number, lastBatchNumber: number | null, isUrgent?: boolean, daysPassed?: number }[] = []
                let targetTotalTime = 0

                // If it's a routine task with no specific house targeted yet, consider only ACTIVE houses
                const activeGreenhouseIds = Array.from(new Set(activeCycles.map(c => c.greenhouseId)))
                const effectiveHouses = ghIds.length > 0 ? ghIds : activeGreenhouseIds

                // Pre-calculate groups for Irrigation and Pesticide Spraying proration
                const perHouseGroups = new Map<string, number>()
                if (workName === 'かん水' || workName === '薬剤散布') {
                    allGreenhouses.forEach(g => {
                        const prefix = g.name.split('-')[0] // Group by prefix (e.g. "⑧" from "⑧-1")
                        perHouseGroups.set(prefix, (perHouseGroups.get(prefix) || 0) + g.areaAcre)
                    })
                }

                // Determine if this task as a whole has urgent items
                let hasUrgentTarget = false

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

                        const lastBatchNumber = cycleBatchMap.get(ghId) ?? null

                        // --- Pesticide Urgent Logic ---
                        let isUrgent = false
                        let daysPassed = 0

                        // Check if this is the Pesticide task and it has NOT been completed today
                        const thisHouseRecordsToday = todaysRecords.filter(r =>
                            r.workName === '薬剤散布' && r.greenhouseName === greenhouse.name
                        )
                        const completedToday = thisHouseRecordsToday.length > 0

                        if (workName === '薬剤散布' && !completedToday) {
                            const lastDate = lastPesticideDateMap.get(greenhouse.name)
                            if (lastDate) {
                                // Normalize to start of day for accurate interval calculation
                                const lastUTC = new Date(Date.UTC(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate()))
                                daysPassed = Math.floor((todayUTC.getTime() - lastUTC.getTime()) / (1000 * 60 * 60 * 24))

                                const month = todayUTC.getMonth() + 1 // 1-12
                                const isSummerInterval = month >= 6 && month <= 10
                                const limitDays = isSummerInterval ? 5 : 7

                                if (daysPassed >= limitDays) {
                                    isUrgent = true
                                    hasUrgentTarget = true
                                }
                            } else {
                                // Never sprayed before? Very urgent.
                                daysPassed = 999
                                isUrgent = true
                                hasUrgentTarget = true
                            }
                        }

                        targets.push({
                            greenhouseId: ghId,
                            greenhouseName: greenhouse.name,
                            areaAcre: greenhouse.areaAcre,
                            targetTime,
                            lastBatchNumber,
                            isUrgent,
                            daysPassed
                        })
                        targetTotalTime += targetTime
                    }
                }

                // If this is an urgent pesticide task, sort targets to show urgent ones first
                if (hasUrgentTarget) {
                    targets.sort((a, b) => {
                        if (a.isUrgent === b.isUrgent) {
                            return (b.daysPassed || 0) - (a.daysPassed || 0) // longest passed first
                        }
                        return a.isUrgent ? -1 : 1
                    })
                }

                finalResults.push({
                    manual,
                    targets,
                    targetTotalTime,
                    actualTime: totalActualTimeForWork, // Total for this work type
                    requiredTime10a: manual.requiredTime10a || 0,
                    isCompleted: totalActualTimeForWork > 0,
                    hasUrgentTarget
                })
            }
        }
    }

    // Finally sort to move completed tasks to the end, and urgent tasks to the top
    return finalResults.sort((a, b) => {
        if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1
        if (a.hasUrgentTarget !== b.hasUrgentTarget) return a.hasUrgentTarget ? -1 : 1
        return 0
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

    // --- For Trouble Logging Section ---
    const allGreenhouses = await prisma.greenhouse.findMany()
    const todayUTC = new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()))
    const activeCycles = await prisma.cropCycle.findMany({
        where: { OR: [{ harvestEnd: null }, { harvestEnd: { gte: todayUTC } }] }
    })
    const cycleBatchMap = new Map()
    for (const c of activeCycles) cycleBatchMap.set(c.greenhouseId, c.batchNumber)

    const ghForTrouble = allGreenhouses.map(g => ({
        id: g.id,
        name: g.name,
        areaAcre: g.areaAcre,
        lastBatchNumber: cycleBatchMap.get(g.id) || null
    }))

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

            {/* Trouble Logging Section */}
            <section className={styles.section}>
                <div className={styles.troubleSection}>
                    <h2 className={styles.troubleTitle}>
                        <span>⚠️</span> トラブル・例外対応の記録
                    </h2>
                    <p className={styles.troubleDescription}>
                        病害虫の発見や、想定外の例外作業を行った際の記録と写真を残します。
                    </p>
                    <QuickRecordForm
                        workName="トラブル・観察メモ"
                        suggestedGreenhouses={ghForTrouble}
                        defaultTime10a={0}
                    />
                </div>
            </section>
            {riskAlerts.length > 0 && (
                <section className={styles.section}>
                    <h2 className={`${styles.sectionTitle} ${styles.dangerTitle}`}>
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
                        <DashboardWorkCard
                            key={i}
                            workTarget={{
                                manual: {
                                    id: wt.manual.id,
                                    workName: wt.manual.workName,
                                    stage: wt.manual.stage,
                                    purpose: wt.manual.purpose,
                                    timingStandard: wt.manual.timingStandard,
                                    requiredTime10a: wt.manual.requiredTime10a,
                                },
                                displayWorkName: wt.displayWorkName,
                                targets: wt.targets,
                                targetTotalTime: wt.targetTotalTime,
                                actualTime: wt.actualTime,
                                requiredTime10a: wt.requiredTime10a,
                                isCompleted: wt.isCompleted,
                                hasUrgentTarget: wt.hasUrgentTarget,
                            }}
                        />
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

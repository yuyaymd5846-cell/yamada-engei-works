
'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import styles from './gantt.module.css'

const CycleModal = dynamic(() => import('./CycleModal'), { ssr: false })

interface Variety {
    name: string
    count: number
}

interface CropCycle {
    id: string
    greenhouseId: string
    greenhouseName: string
    batchNumber: number | null
    varieties: string | Variety[]
    memo: string | null
    disinfectionStart: string | null
    disinfectionEnd: string | null
    plantingDate: string | null
    lightsOffDate: string | null
    harvestStart: string | null
    harvestEnd: string | null
    isParentStock?: boolean
    pinchingDate?: string | null
    cuttingsStart?: string | null
    cleanupDate?: string | null
}

interface Greenhouse {
    id: string
    name: string
    areaAcre: number
}

// Japanese national holidays (fixed dates + equinox approximations)
function isJapaneseHoliday(d: Date): boolean {
    const m = d.getMonth() + 1
    const day = d.getDate()
    const y = d.getFullYear()
    const wd = d.getDay()

    // Fixed holidays
    const fixed: Record<string, number[]> = {
        '1': [1, 2, 3], '2': [11, 23], '4': [29], '5': [3, 4, 5],
        '7': [21], '8': [11], '9': [23], '10': [14],
        '11': [3, 23], '12': [31]
    }
    if (fixed[String(m)]?.includes(day)) return true

    // Happy Monday holidays
    const nthMon = (m2: number, n: number) => {
        const first = new Date(y, m2 - 1, 1)
        const firstMon = (8 - first.getDay()) % 7 || 7
        return firstMon + (n - 1) * 7
    }
    if (m === 1 && day === nthMon(1, 2)) return true // Coming of Age
    if (m === 7 && day === nthMon(7, 3)) return true // Marine Day
    if (m === 9 && day === nthMon(9, 3)) return true // Respect for Aged
    if (m === 10 && day === nthMon(10, 2)) return true // Sports Day

    // Vernal/Autumnal equinox (approximation)
    if (m === 3 && day === Math.floor(20.8431 + 0.242194 * (y - 1980) - Math.floor((y - 1980) / 4))) return true
    if (m === 9 && day === Math.floor(23.2488 + 0.242194 * (y - 1980) - Math.floor((y - 1980) / 4))) return true

    // Substitute holiday: if a holiday falls on Sunday, the next Monday is a holiday
    if (wd === 1) {
        const yesterday = new Date(y, m - 1, day - 1)
        if (yesterday.getDay() === 0 && isJapaneseHoliday(yesterday)) return true
    }

    return false
}

export default function SchedulePage() {
    const [cycles, setCycles] = useState<CropCycle[]>([])
    const [greenhouses, setGreenhouses] = useState<Greenhouse[]>([])
    const [orderedIds, setOrderedIds] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [isViewPending, startViewTransition] = useTransition()

    // Modal
    const [isModalOpen, setIsModalOpen] = useState(false)
    interface ParsedCropCycle extends Omit<CropCycle, 'varieties'> { varieties: Variety[] }
    const [selectedCycle, setSelectedCycle] = useState<Partial<ParsedCropCycle>>({})

    // Calendar
    const [currentDate, setCurrentDate] = useState(() => {
        const d = new Date(); d.setHours(0, 0, 0, 0); return d
    })
    const [viewMode, setViewMode] = useState<'week' | 'month' | 'year'>('month')

    // Refs for synced scrolling
    const ghPanelRef = useRef<HTMLDivElement>(null)
    const timelinePanelRef = useRef<HTMLDivElement>(null)
    const isSyncing = useRef(false)

    // Drag state
    const dragIndex = useRef<number | null>(null)
    const [dragOver, setDragOver] = useState<number | null>(null)

    const fetchData = useCallback(async (initial = false) => {
        if (initial) {
            setLoading(true)
        } else {
            setIsRefreshing(true)
        }
        try {
            const [cycleRes, ghRes] = await Promise.all([
                fetch('/api/crop-cycle').then(r => r.json()),
                fetch('/api/greenhouse').then(r => r.json())
            ])
            if (Array.isArray(cycleRes)) setCycles(cycleRes)
            else { console.error("Cycles not array:", cycleRes); setCycles([]) }

            if (Array.isArray(ghRes)) {
                setGreenhouses(ghRes)
                const allIds = ghRes.map((g: Greenhouse) => g.id)
                setOrderedIds(allIds)
            } else { console.error("Greenhouses not array:", ghRes); setGreenhouses([]) }
        } catch (err) { console.error("Fetch error:", err) }
        finally {
            setLoading(false)
            setIsRefreshing(false)
        }
    }, [])

    useEffect(() => {
        void fetchData(true)
        const timer = setTimeout(() => {
            setLoading(prev => { if (prev) console.warn("Timeout"); return false })
        }, 10000)
        return () => clearTimeout(timer)
    }, [fetchData])

    // Sync vertical scroll between left panel and timeline
    const handleTimelineScroll = useCallback(() => {
        if (isSyncing.current) return
        isSyncing.current = true
        if (timelinePanelRef.current && ghPanelRef.current) {
            ghPanelRef.current.scrollTop = timelinePanelRef.current.scrollTop
        }
        requestAnimationFrame(() => { isSyncing.current = false })
    }, [])

    const handleGhScroll = useCallback(() => {
        if (isSyncing.current) return
        isSyncing.current = true
        if (ghPanelRef.current && timelinePanelRef.current) {
            timelinePanelRef.current.scrollTop = ghPanelRef.current.scrollTop
        }
        requestAnimationFrame(() => { isSyncing.current = false })
    }, [])

    const orderedGreenhouses = useMemo(() => {
        const greenhouseMap = new Map(greenhouses.map(g => [g.id, g]))
        return orderedIds
            .map(id => greenhouseMap.get(id))
            .filter(Boolean) as Greenhouse[]
    }, [greenhouses, orderedIds])

    const cyclesByGreenhouse = useMemo(() => {
        const map = new Map<string, CropCycle[]>()
        cycles.forEach(cycle => {
            const existing = map.get(cycle.greenhouseId)
            if (existing) {
                existing.push(cycle)
            } else {
                map.set(cycle.greenhouseId, [cycle])
            }
        })
        return map
    }, [cycles])

    const days = useMemo(() => {
        const days: Date[] = []
        const start = new Date(currentDate); start.setHours(0, 0, 0, 0)
        if (viewMode === 'year') {
            // Start from Jan 1 of the current year
            start.setMonth(0, 1)
            for (let i = 0; i < 365; i++) {
                const d = new Date(start); d.setDate(start.getDate() + i); days.push(d)
            }
        } else if (viewMode === 'month') {
            start.setDate(start.getDate() - 5)
            for (let i = 0; i < 40; i++) {
                const d = new Date(start); d.setDate(start.getDate() + i); days.push(d)
            }
        } else {
            for (let i = 0; i < 7; i++) {
                const d = new Date(start); d.setDate(start.getDate() + i); days.push(d)
            }
        }
        return days
    }, [currentDate, viewMode])

    const DAY_WIDTH = viewMode === 'year' ? 3 : viewMode === 'month' ? 30 : 100
    const ROW_HEIGHT = 48

    // Helpers for cell class
    const getDayClass = (d: Date, isGrid = false) => {
        const todayMatch = d.toDateString() === todayStr
        const dow = d.getDay()
        const holiday = isJapaneseHoliday(d)
        const classes: string[] = []
        if (isGrid) {
            classes.push(styles.gridCell)
            if (todayMatch) classes.push(styles.todayGridCell)
            if (dow === 0 || holiday) classes.push(styles.sundayGridCell)
            else if (dow === 6) classes.push(styles.saturdayGridCell)
        } else {
            classes.push(styles.dayCell)
            if (todayMatch) classes.push(styles.todayCell)
            if (dow === 0 || holiday) classes.push(styles.sundayCell)
            else if (dow === 6) classes.push(styles.saturdayCell)
        }
        return classes.join(' ')
    }

    const getBarStyle = (start: string | null, end: string | null, color: string) => {
        if (!start) return null
        const startProp = new Date(start); startProp.setHours(0, 0, 0, 0)
        if (isNaN(startProp.getTime())) return null
        const endProp = end ? new Date(end) : new Date(new Date(start).setDate(new Date(start).getDate() + 7))
        endProp.setHours(23, 59, 59, 999)
        if (isNaN(endProp.getTime())) return null
        const viewStart = days[0]
        const viewEnd = new Date(days[days.length - 1]); viewEnd.setHours(23, 59, 59, 999)
        if (endProp < viewStart || startProp > viewEnd) return null
        const diffTime = startProp.getTime() - viewStart.getTime()
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
        const leftOffset = diffDays < 0 ? 0 : diffDays * DAY_WIDTH
        const effectiveStart = startProp < viewStart ? viewStart : startProp
        const effectiveEnd = endProp > viewEnd ? viewEnd : endProp
        const visibleDurationDays = Math.ceil((effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24))
        const finalWidth = Math.max(1, visibleDurationDays) * DAY_WIDTH
        return { left: `${leftOffset}px`, width: `${finalWidth}px`, backgroundColor: color }
    }

    const handleSaveCycle = async (data: Partial<CropCycle>) => {
        const method = data.id ? 'PATCH' : 'POST'
        const rawV = data.varieties
        const body = { ...data, varieties: typeof rawV === 'string' ? JSON.parse(rawV) : rawV }
        try {
            const res = await fetch('/api/crop-cycle', {
                method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
            })
            if (res.ok) {
                setIsModalOpen(false)
                await fetchData()
            }
        } catch { alert('保存に失敗しました') }
    }

    const handleDeleteCycle = async (id: string) => {
        if (!confirm('この作付を削除しますか？')) return
        try {
            const res = await fetch(`/api/crop-cycle?id=${id}`, { method: 'DELETE' })
            if (res.ok) {
                setIsModalOpen(false)
                await fetchData()
            }
        } catch { alert('削除に失敗しました') }
    }

    const openNewCycle = (gh: Greenhouse) => {
        // Find previous cycles for this greenhouse to pre-fill varieties
        const ghCycles = cycles.filter(c => c.greenhouseId === gh.id)
        let prevVarieties: Variety[] = [{ name: '', count: 0 }]
        let nextBatch = 1

        if (ghCycles.length > 0) {
            // Sort by plantingDate desc to get the latest
            const sorted = [...ghCycles].sort((a, b) => {
                const da = a.plantingDate ? new Date(a.plantingDate).getTime() : 0
                const db = b.plantingDate ? new Date(b.plantingDate).getTime() : 0
                return db - da
            })
            const latest = sorted[0]

            // Copy varieties from the most recent cycle
            let varieties = latest.varieties
            if (typeof varieties === 'string') {
                try { varieties = JSON.parse(varieties) } catch { varieties = [] }
            }
            if (Array.isArray(varieties) && varieties.length > 0) {
                prevVarieties = varieties as Variety[]
            }

            // Auto-increment batch number
            nextBatch = (latest.batchNumber || 0) + 1
        }

        setSelectedCycle({
            greenhouseId: gh.id,
            greenhouseName: gh.name,
            batchNumber: nextBatch,
            varieties: prevVarieties,
            isParentStock: false
        })
        setIsModalOpen(true)
    }

    const openEditCycle = (cycle: CropCycle) => {
        let varieties = cycle.varieties
        if (typeof varieties === 'string') { try { varieties = JSON.parse(varieties) } catch { varieties = [] } }
        setSelectedCycle({ ...cycle, varieties: varieties as Variety[] })
        setIsModalOpen(true)
    }

    // Drag handlers
    const onDragStart = (index: number) => { dragIndex.current = index }
    const onDragEnter = (index: number) => { setDragOver(index) }
    const onDragEnd = () => {
        if (dragIndex.current !== null && dragOver !== null && dragIndex.current !== dragOver) {
            const newOrder = [...orderedIds]
            const [moved] = newOrder.splice(dragIndex.current, 1)
            newOrder.splice(dragOver, 0, moved)
            setOrderedIds(newOrder)

            // Save the new order to the database
            fetch('/api/greenhouse/reorder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderedIds: newOrder })
            }).catch(err => console.error("Failed to save new order:", err))
        }
        dragIndex.current = null
        setDragOver(null)
    }

    // Touch drag
    const touchStartY = useRef<number>(0)
    const onTouchStart = (e: React.TouchEvent, index: number) => {
        dragIndex.current = index
        touchStartY.current = e.touches[0].clientY
    }
    const onTouchMove = (e: React.TouchEvent) => {
        if (dragIndex.current === null) return
        const dy = e.touches[0].clientY - touchStartY.current
        const steps = Math.round(dy / ROW_HEIGHT)
        setDragOver(Math.max(0, Math.min(orderedIds.length - 1, dragIndex.current + steps)))
    }
    const onTouchEnd = () => { onDragEnd() }

    const todayStr = useMemo(() => new Date().toDateString(), [])

    // Calculate today's offset for the marker line
    const todayMarkerLeft = useMemo(() => {
        const todayIndex = days.findIndex(d => d.toDateString() === todayStr)
        return todayIndex >= 0 ? todayIndex * DAY_WIDTH + DAY_WIDTH / 2 : -1
    }, [DAY_WIDTH, days, todayStr])

    // Auto-scroll to today on mount / view change
    useEffect(() => {
        if (timelinePanelRef.current && todayMarkerLeft >= 0) {
            const panelWidth = timelinePanelRef.current.clientWidth
            timelinePanelRef.current.scrollLeft = Math.max(0, todayMarkerLeft - panelWidth / 3)
        }
    }, [loading, todayMarkerLeft, viewMode])

    if (loading) return <div className={styles.container}>読み込み中...</div>

    // Navigation step size
    const navStep = viewMode === 'year' ? 90 : viewMode === 'month' ? 30 : 7

    // Month separator positions for year view
    const monthSeparators = viewMode === 'year' ? (() => {
        const seps: { left: number; label: string }[] = []
        let prevMonth = -1
        days.forEach((d, i) => {
            if (d.getMonth() !== prevMonth) {
                seps.push({ left: i * DAY_WIDTH, label: `${d.getMonth() + 1}月` })
                prevMonth = d.getMonth()
            }
        })
        return seps
    })() : []

    const isBusy = isRefreshing || isViewPending

    return (
        <div className={styles.container} aria-busy={isBusy}>
            <header className={styles.header}>
                <div className={styles.controls}>
                    <button className={styles.todayBtn} disabled={isBusy} onClick={() => {
                        startViewTransition(() => {
                            const d = new Date()
                            d.setHours(0, 0, 0, 0)
                            setCurrentDate(d)
                        })
                    }}>今日</button>
                    <div className={styles.navGroup}>
                        <button disabled={isBusy} onClick={() => {
                            startViewTransition(() => {
                                const d = new Date(currentDate)
                                d.setDate(d.getDate() - navStep)
                                setCurrentDate(d)
                            })
                        }}>◀</button>
                        <span>{currentDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })}</span>
                        <button disabled={isBusy} onClick={() => {
                            startViewTransition(() => {
                                const d = new Date(currentDate)
                                d.setDate(d.getDate() + navStep)
                                setCurrentDate(d)
                            })
                        }}>▶</button>
                    </div>
                    <div className={styles.viewToggle}>
                        <button className={viewMode === 'week' ? styles.active : ''} disabled={isBusy} onClick={() => startViewTransition(() => setViewMode('week'))}>週</button>
                        <button className={viewMode === 'month' ? styles.active : ''} disabled={isBusy} onClick={() => startViewTransition(() => setViewMode('month'))}>月</button>
                        <button className={viewMode === 'year' ? styles.active : ''} disabled={isBusy} onClick={() => startViewTransition(() => setViewMode('year'))}>年</button>
                    </div>
                    <div className={`${styles.statusBadge} ${isBusy ? styles.statusBusy : ''}`}>
                        {isRefreshing ? 'データ更新中...' : isViewPending ? '表示を切替中...' : '最新'}
                    </div>
                </div>
            </header>

            {/* Legend */}
            <div className={styles.legend}>
                <span className={styles.legendItem}><span style={{ background: '#4caf50' }} className={styles.legendDot} />定植〜消灯/摘芯</span>
                <span className={styles.legendItem}><span style={{ background: '#2196f3' }} className={styles.legendDot} />消灯〜収穫</span>
                <span className={styles.legendItem}><span style={{ background: '#fd7e14' }} className={styles.legendDot} />摘芯〜採穂</span>
                <span className={styles.legendItem}><span style={{ background: '#ffc107' }} className={styles.legendDot} />収穫/採穂</span>
                <span className={styles.legendItem}><span style={{ background: '#adb5bd' }} className={styles.legendDot} />消毒</span>
            </div>

            {/* Two-Panel Chart: left panel fixed, right panel scrolls horizontally */}
            <div className={styles.chartLayout}>
                {/* Left panel: Greenhouse names (fixed, no horizontal scroll) */}
                <div className={styles.ghPanel} ref={ghPanelRef} onScroll={handleGhScroll}>
                    <div className={`${styles.ghPanelHeader} ${viewMode === 'year' ? styles.ghPanelHeaderCompact : ''}`}>ハウス</div>
                    {orderedGreenhouses.map((gh, index) => (
                        <div
                            key={gh.id}
                            className={`${styles.ghCell} ${dragOver === index ? styles.ghCellDragOver : ''}`}
                            draggable
                            onDragStart={() => onDragStart(index)}
                            onDragEnter={() => onDragEnter(index)}
                            onDragEnd={onDragEnd}
                            onDragOver={e => e.preventDefault()}
                            onClick={() => openNewCycle(gh)}
                        >
                            <div
                                className={styles.dragHandle}
                                onTouchStart={(e) => { e.stopPropagation(); onTouchStart(e, index) }}
                                onTouchMove={onTouchMove}
                                onTouchEnd={onTouchEnd}
                                onClick={e => e.stopPropagation()}
                            >⠿</div>
                            <div className={styles.ghInfo}>
                                <div className={styles.ghName}>{gh.name}</div>
                                <div className={styles.ghArea}>{gh.areaAcre}a</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Right panel: Timeline (scrolls both directions) */}
                <div className={styles.timelinePanel} ref={timelinePanelRef} onScroll={handleTimelineScroll}>
                    {/* Header: year view shows only month labels; week/month show day cells */}
                    {viewMode === 'year' ? (
                        <div className={styles.yearMonthHeader} style={{ width: days.length * DAY_WIDTH }}>
                            {monthSeparators.map((sep, i) => {
                                const nextLeft = i < monthSeparators.length - 1 ? monthSeparators[i + 1].left : days.length * DAY_WIDTH
                                const width = nextLeft - sep.left
                                return (
                                    <div key={i} className={styles.yearMonthCell} style={{ left: sep.left, width }}>
                                        {sep.label}
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className={styles.timelineHeader} style={{ width: days.length * DAY_WIDTH }}>
                            {days.map(d => (
                                <div
                                    key={d.toString()}
                                    className={getDayClass(d)}
                                    style={{ width: DAY_WIDTH }}
                                >
                                    <div className={styles.dayLabel}>{d.getDate()}</div>
                                    <div className={`${styles.wdLabel} ${d.getDay() === 0 || isJapaneseHoliday(d) ? styles.wdSunday : d.getDay() === 6 ? styles.wdSaturday : ''}`}>
                                        {['日', '月', '火', '水', '木', '金', '土'][d.getDay()]}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {orderedGreenhouses.map((gh) => (
                        <div key={gh.id} className={styles.timelineRow} style={{ width: days.length * DAY_WIDTH }}>
                            {days.map(d => (
                                <div
                                    key={d.toString()}
                                    className={getDayClass(d, true)}
                                    style={{ width: DAY_WIDTH }}
                                />
                            ))}
                            {/* Today marker line */}
                            {todayMarkerLeft >= 0 && (
                                <div className={styles.todayMarker} style={{ left: todayMarkerLeft }} />
                            )}
                            {(cyclesByGreenhouse.get(gh.id) ?? []).map(cycle => {
                                const diffDays = (a: string | null | undefined, b: string | null | undefined) => {
                                    if (!a || !b) return null
                                    const da = new Date(a), db = new Date(b)
                                    if (isNaN(da.getTime()) || isNaN(db.getTime())) return null
                                    return Math.round((db.getTime() - da.getTime()) / (1000 * 60 * 60 * 24))
                                }

                                const renderBar = (start: string | null | undefined, end: string | null | undefined, color: string, label: string) => {
                                    const style = getBarStyle(start || null, end || null, color)
                                    if (!style) return null
                                    return (
                                        <div className={styles.bar} style={style} onClick={(e) => {
                                            e.stopPropagation(); openEditCycle(cycle)
                                        }}>
                                            <span className={styles.barText}>{label}</span>
                                        </div>
                                    )
                                }

                                if (cycle.isParentStock) {
                                    const plantDays = diffDays(cycle.plantingDate, cycle.pinchingDate)
                                    const plantLabel = viewMode === 'year' ? (plantDays !== null ? `${plantDays}d` : '') : (plantDays !== null ? `定植 ${plantDays}d` : '定植')

                                    const pinchDays = diffDays(cycle.pinchingDate, cycle.cuttingsStart)
                                    const pinchLabel = viewMode === 'year' ? (pinchDays !== null ? `${pinchDays}d` : '') : (pinchDays !== null ? `摘芯 ${pinchDays}d` : '摘芯')

                                    const cutDays = diffDays(cycle.cuttingsStart, cycle.cleanupDate)
                                    const cutLabel = viewMode === 'year' ? (cutDays !== null ? `全${cutDays}d` : '') : (cutDays !== null ? `採穂 全${cutDays}d` : '採穂開始')

                                    const disinfectLabel = viewMode === 'year' ? '' : '消毒'

                                    return (
                                        <div key={cycle.id}>
                                            {renderBar(cycle.disinfectionStart, cycle.disinfectionEnd, '#adb5bd', disinfectLabel)}
                                            {renderBar(cycle.plantingDate, cycle.pinchingDate, '#4caf50', plantLabel)}
                                            {renderBar(cycle.pinchingDate, cycle.cuttingsStart, '#fd7e14', pinchLabel)}
                                            {renderBar(cycle.cuttingsStart, cycle.cleanupDate, '#ffc107', cutLabel)}
                                        </div>
                                    )
                                } else {
                                    // Green: planting→lights off (show days)
                                    const greenDays = diffDays(cycle.plantingDate, cycle.lightsOffDate)
                                    const greenLabel = viewMode === 'year'
                                        ? (greenDays !== null ? `${greenDays}d` : '')
                                        : (greenDays !== null ? `定植 ${greenDays}d` : '定植')

                                    // Blue: lights off→harvest start (show days)
                                    const blueDays = diffDays(cycle.lightsOffDate, cycle.harvestStart)
                                    const blueLabel = viewMode === 'year'
                                        ? (blueDays !== null ? `${blueDays}d` : '')
                                        : (blueDays !== null ? `消灯 ${blueDays}d` : '消灯')

                                    // Yellow: harvest, show total planting→harvest end
                                    const totalDays = diffDays(cycle.plantingDate, cycle.harvestEnd)
                                    const yellowLabel = viewMode === 'year'
                                        ? (totalDays !== null ? `全${totalDays}d` : '')
                                        : (totalDays !== null ? `収穫 全${totalDays}d` : '収穫')

                                    // Grey: disinfection
                                    const disinfectLabel = viewMode === 'year' ? '' : '消毒'

                                    return (
                                        <div key={cycle.id}>
                                            {renderBar(cycle.disinfectionStart, cycle.disinfectionEnd, '#adb5bd', disinfectLabel)}
                                            {renderBar(cycle.plantingDate, cycle.lightsOffDate, '#4caf50', greenLabel)}
                                            {renderBar(cycle.lightsOffDate, cycle.harvestStart, '#2196f3', blueLabel)}
                                            {renderBar(cycle.harvestStart, cycle.harvestEnd, '#ffc107', yellowLabel)}
                                        </div>
                                    )
                                }
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {isModalOpen && (
                <CycleModal
                    isOpen={isModalOpen}
                    initialData={selectedCycle}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveCycle}
                    onDelete={handleDeleteCycle}
                />
            )}

            <p className={styles.hint}>
                💡 <b>ハウス名</b>をタップで新規作成、<b>バー</b>をタップで詳細修正。<b>⠿</b>をドラッグで並び替え。
            </p>
        </div>
    )
}

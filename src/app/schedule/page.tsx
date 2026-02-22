
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import styles from './gantt.module.css'
import CycleModal from './CycleModal'

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
}

interface Greenhouse {
    id: string
    name: string
    areaAcre: number
}

const LS_ORDER_KEY = 'gh-row-order'

export default function SchedulePage() {
    const [cycles, setCycles] = useState<CropCycle[]>([])
    const [greenhouses, setGreenhouses] = useState<Greenhouse[]>([])
    const [orderedIds, setOrderedIds] = useState<string[]>([])
    const [loading, setLoading] = useState(true)

    // Modal
    const [isModalOpen, setIsModalOpen] = useState(false)
    interface ParsedCropCycle extends Omit<CropCycle, 'varieties'> { varieties: Variety[] }
    const [selectedCycle, setSelectedCycle] = useState<Partial<ParsedCropCycle>>({})

    // Calendar
    const [currentDate, setCurrentDate] = useState(() => {
        const d = new Date(); d.setHours(0, 0, 0, 0); return d
    })
    const [viewMode, setViewMode] = useState<'week' | 'month'>('month')

    // Refs for synced scrolling
    const ghPanelRef = useRef<HTMLDivElement>(null)
    const timelinePanelRef = useRef<HTMLDivElement>(null)
    const isSyncing = useRef(false)

    // Drag state
    const dragIndex = useRef<number | null>(null)
    const [dragOver, setDragOver] = useState<number | null>(null)

    const fetchData = async () => {
        try {
            const [cycleRes, ghRes] = await Promise.all([
                fetch('/api/crop-cycle').then(r => r.json()),
                fetch('/api/greenhouse').then(r => r.json())
            ])
            if (Array.isArray(cycleRes)) setCycles(cycleRes)
            else { console.error("Cycles not array:", cycleRes); setCycles([]) }

            if (Array.isArray(ghRes)) {
                setGreenhouses(ghRes)
                const saved = JSON.parse(localStorage.getItem(LS_ORDER_KEY) || '[]') as string[]
                const allIds = ghRes.map((g: Greenhouse) => g.id)
                const merged = [
                    ...saved.filter((id: string) => allIds.includes(id)),
                    ...allIds.filter((id: string) => !saved.includes(id))
                ]
                setOrderedIds(merged)
            } else { console.error("Greenhouses not array:", ghRes); setGreenhouses([]) }
        } catch (err) { console.error("Fetch error:", err) }
        finally { setLoading(false) }
    }

    useEffect(() => {
        fetchData()
        const timer = setTimeout(() => {
            setLoading(prev => { if (prev) console.warn("Timeout"); return false })
        }, 10000)
        return () => clearTimeout(timer)
    }, [])

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

    const orderedGreenhouses = orderedIds
        .map(id => greenhouses.find(g => g.id === id))
        .filter(Boolean) as Greenhouse[]

    const getDaysInView = () => {
        const days: Date[] = []
        const start = new Date(currentDate); start.setHours(0, 0, 0, 0)
        const count = viewMode === 'week' ? 7 : 30
        for (let i = 0; i < count; i++) {
            const d = new Date(start); d.setDate(start.getDate() + i); days.push(d)
        }
        return days
    }

    const days = getDaysInView()
    const DAY_WIDTH = viewMode === 'month' ? 30 : 100
    const ROW_HEIGHT = 48
    const ROW_HEIGHT_DESKTOP = 60

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
            if (res.ok) { setIsModalOpen(false); fetchData() }
        } catch { alert('保存に失敗しました') }
    }

    const handleDeleteCycle = async (id: string) => {
        if (!confirm('この作付を削除しますか？')) return
        try {
            const res = await fetch(`/api/crop-cycle?id=${id}`, { method: 'DELETE' })
            if (res.ok) { setIsModalOpen(false); fetchData() }
        } catch { alert('削除に失敗しました') }
    }

    const openNewCycle = (gh: Greenhouse) => {
        setSelectedCycle({ greenhouseId: gh.id, greenhouseName: gh.name, batchNumber: 1, varieties: [{ name: '', count: 0 }] })
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
            localStorage.setItem(LS_ORDER_KEY, JSON.stringify(newOrder))
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

    if (loading) return <div className={styles.container}>読み込み中...</div>

    const todayStr = new Date().toDateString()

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.controls}>
                    <button className={styles.todayBtn} onClick={() => {
                        const d = new Date(); d.setHours(0, 0, 0, 0); setCurrentDate(d)
                    }}>今日</button>
                    <div className={styles.navGroup}>
                        <button onClick={() => {
                            const d = new Date(currentDate)
                            d.setDate(d.getDate() - (viewMode === 'month' ? 30 : 7))
                            setCurrentDate(d)
                        }}>◀</button>
                        <span>{currentDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })}</span>
                        <button onClick={() => {
                            const d = new Date(currentDate)
                            d.setDate(d.getDate() + (viewMode === 'month' ? 30 : 7))
                            setCurrentDate(d)
                        }}>▶</button>
                    </div>
                    <div className={styles.viewToggle}>
                        <button className={viewMode === 'week' ? styles.active : ''} onClick={() => setViewMode('week')}>週</button>
                        <button className={viewMode === 'month' ? styles.active : ''} onClick={() => setViewMode('month')}>月</button>
                    </div>
                </div>
            </header>

            {/* Legend */}
            <div className={styles.legend}>
                <span className={styles.legendItem}><span style={{ background: '#4caf50' }} className={styles.legendDot} />定植〜消灯</span>
                <span className={styles.legendItem}><span style={{ background: '#2196f3' }} className={styles.legendDot} />消灯〜収穫</span>
                <span className={styles.legendItem}><span style={{ background: '#ffc107' }} className={styles.legendDot} />収穫</span>
                <span className={styles.legendItem}><span style={{ background: '#adb5bd' }} className={styles.legendDot} />消毒</span>
            </div>

            {/* Two-Panel Chart: left panel fixed, right panel scrolls horizontally */}
            <div className={styles.chartLayout}>
                {/* Left panel: Greenhouse names (fixed, no horizontal scroll) */}
                <div className={styles.ghPanel} ref={ghPanelRef} onScroll={handleGhScroll}>
                    <div className={styles.ghPanelHeader}>ハウス</div>
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
                    <div className={styles.timelineHeader} style={{ width: days.length * DAY_WIDTH }}>
                        {days.map(d => (
                            <div
                                key={d.toString()}
                                className={`${styles.dayCell} ${d.toDateString() === todayStr ? styles.todayCell : ''}`}
                                style={{ width: DAY_WIDTH }}
                            >
                                <div className={styles.dayLabel}>{d.getDate()}</div>
                                <div className={styles.wdLabel}>{['日', '月', '火', '水', '木', '金', '土'][d.getDay()]}</div>
                            </div>
                        ))}
                    </div>

                    {orderedGreenhouses.map((gh) => (
                        <div key={gh.id} className={styles.timelineRow} style={{ width: days.length * DAY_WIDTH }}>
                            {days.map(d => (
                                <div
                                    key={d.toString()}
                                    className={`${styles.gridCell} ${d.toDateString() === todayStr ? styles.todayGridCell : ''}`}
                                    style={{ width: DAY_WIDTH }}
                                />
                            ))}
                            {cycles.filter(c => c.greenhouseId === gh.id).map(cycle => {
                                const renderBar = (start: string | null, end: string | null, color: string, label: string) => {
                                    const style = getBarStyle(start, end, color)
                                    if (!style) return null
                                    return (
                                        <div className={styles.bar} style={style} onClick={(e) => {
                                            e.stopPropagation(); openEditCycle(cycle)
                                        }}>
                                            <span className={styles.barText}>{label}</span>
                                        </div>
                                    )
                                }
                                return (
                                    <div key={cycle.id}>
                                        {renderBar(cycle.disinfectionStart, cycle.disinfectionEnd, '#adb5bd', '消毒')}
                                        {renderBar(cycle.plantingDate, cycle.lightsOffDate, '#4caf50', '定植')}
                                        {renderBar(cycle.lightsOffDate, cycle.harvestStart, '#2196f3', '消灯')}
                                        {renderBar(cycle.harvestStart, cycle.harvestEnd, '#ffc107', '収穫')}
                                    </div>
                                )
                            })}
                        </div>
                    ))}
                </div>
            </div>

            <CycleModal
                isOpen={isModalOpen}
                initialData={selectedCycle as any}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveCycle}
                onDelete={handleDeleteCycle}
            />

            <p className={styles.hint}>
                💡 <b>ハウス名</b>をタップで新規作成、<b>バー</b>をタップで詳細修正。<b>⠿</b>をドラッグで並び替え。
            </p>
        </div>
    )
}

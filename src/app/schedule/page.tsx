
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
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
    varieties: string | Variety[] // Can be JSON string from DB
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

export default function SchedulePage() {
    const [cycles, setCycles] = useState<CropCycle[]>([])
    const [greenhouses, setGreenhouses] = useState<Greenhouse[]>([])
    const [loading, setLoading] = useState(true)

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false)
    // Ensure varieties is always treated as array in the modal state
    interface ParsedCropCycle extends Omit<CropCycle, 'varieties'> { varieties: Variety[] }
    const [selectedCycle, setSelectedCycle] = useState<Partial<ParsedCropCycle>>({})

    // Calendar View State
    const [currentDate, setCurrentDate] = useState(() => {
        const d = new Date()
        d.setHours(0, 0, 0, 0)
        return d
    })
    const [viewMode, setViewMode] = useState<'week' | 'month'>('month')

    const fetchData = async () => {
        try {
            const [cycleRes, ghRes] = await Promise.all([
                fetch('/api/crop-cycle').then(res => res.json()),
                fetch('/api/greenhouse').then(res => res.json())
            ])

            // Safety Check: Ensure we got arrays back
            if (Array.isArray(cycleRes)) {
                setCycles(cycleRes)
            } else {
                console.error("Cycles response is not an array:", cycleRes)
                setCycles([])
            }

            if (Array.isArray(ghRes)) {
                setGreenhouses(ghRes)
            } else {
                console.error("Greenhouses response is not an array:", ghRes)
                setGreenhouses([])
            }
        } catch (err) {
            console.error("Fetch error:", err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()

        // Failsafe: if data hasn't loaded in 10s, stop the loading spinner anyway
        const timer = setTimeout(() => {
            setLoading(prev => {
                if (prev) console.warn("Loading timed out after 10s")
                return false
            })
        }, 10000)
        return () => clearTimeout(timer)
    }, [])

    const getDaysInView = () => {
        const days = []
        const start = new Date(currentDate)
        start.setHours(0, 0, 0, 0)
        const count = viewMode === 'week' ? 7 : 30
        for (let i = 0; i < count; i++) {
            const d = new Date(start)
            d.setDate(start.getDate() + i)
            days.push(d)
        }
        return days
    }

    const days = getDaysInView()
    const DAY_WIDTH = viewMode === 'month' ? 30 : 100

    const getBarStyle = (start: string | null, end: string | null, color: string) => {
        if (!start) return null
        const startProp = new Date(start)
        startProp.setHours(0, 0, 0, 0)
        if (isNaN(startProp.getTime())) return null

        const endProp = end ? new Date(end) : new Date(new Date(start).setDate(new Date(start).getDate() + 7))
        endProp.setHours(23, 59, 59, 999) // Set to end of day
        if (isNaN(endProp.getTime())) return null

        const viewStart = days[0]
        const viewEnd = new Date(days[days.length - 1])
        viewEnd.setHours(23, 59, 59, 999)

        if (endProp < viewStart || startProp > viewEnd) return null

        // Calculate left offset (clamped to 0)
        const diffTime = startProp.getTime() - viewStart.getTime()
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
        const leftOffset = diffDays < 0 ? 0 : diffDays * DAY_WIDTH

        // Calculate visible duration
        const effectiveStart = startProp < viewStart ? viewStart : startProp
        const effectiveEnd = endProp > viewEnd ? viewEnd : endProp

        const visibleDurationTime = effectiveEnd.getTime() - effectiveStart.getTime()
        const visibleDurationDays = Math.ceil(visibleDurationTime / (1000 * 60 * 60 * 24))

        // Ensure at least 1 day width if it spans even a second
        const finalWidth = Math.max(1, visibleDurationDays) * DAY_WIDTH

        return {
            left: `${leftOffset}px`,
            width: `${finalWidth}px`,
            backgroundColor: color
        }
    }

    const handleSaveCycle = async (data: Partial<CropCycle>) => {
        const method = data.id ? 'PATCH' : 'POST'
        const rawVarieties = data.varieties
        const body = {
            ...data,
            varieties: typeof rawVarieties === 'string' ? JSON.parse(rawVarieties) : rawVarieties
        }

        try {
            const res = await fetch('/api/crop-cycle', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })
            if (res.ok) {
                setIsModalOpen(false)
                fetchData()
            }
        } catch (err) {
            alert('保存に失敗しました')
        }
    }

    const handleDeleteCycle = async (id: string) => {
        if (!confirm('この作付を削除しますか？')) return
        try {
            const res = await fetch(`/api/crop-cycle?id=${id}`, { method: 'DELETE' })
            if (res.ok) {
                setIsModalOpen(false)
                fetchData()
            }
        } catch (err) {
            alert('削除に失敗しました')
        }
    }

    const openNewCycle = (gh: Greenhouse) => {
        setSelectedCycle({
            greenhouseId: gh.id,
            greenhouseName: gh.name,
            batchNumber: 1,
            varieties: [{ name: '', count: 0 }]
        })
        setIsModalOpen(true)
    }

    const openEditCycle = (cycle: CropCycle) => {
        let varieties = cycle.varieties
        if (typeof varieties === 'string') {
            try { varieties = JSON.parse(varieties) } catch (e) { varieties = [] }
        }
        setSelectedCycle({ ...cycle, varieties: varieties as Variety[] })
        setIsModalOpen(true)
    }

    if (loading) return <div className={styles.container}>読み込み中...</div>

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.titleGroup}>
                    <h1>温室ガントチャート</h1>
                    <Link href="/dashboard" className={styles.backLink}>← ダッシュボードへ</Link>
                </div>

                <div className={styles.controls}>
                    <button onClick={() => {
                        const d = new Date()
                        d.setHours(0, 0, 0, 0)
                        setCurrentDate(d)
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
                        <button className={viewMode === 'week' ? styles.active : ''} onClick={() => setViewMode('week')}>1週間</button>
                        <button className={viewMode === 'month' ? styles.active : ''} onClick={() => setViewMode('month')}>1ヶ月</button>
                    </div>
                </div>
            </header>

            <div className={styles.chartWrapper}>
                <div className={styles.chartHeader}>
                    <div className={styles.ghColumnHeader}>ハウス名</div>
                    <div className={styles.timelineHeader} style={{ width: days.length * DAY_WIDTH }}>
                        {days.map(d => (
                            <div key={d.toString()} className={styles.dayCell} style={{ width: DAY_WIDTH }}>
                                <div className={styles.dayLabel}>{d.getDate()}</div>
                                <div className={styles.wdLabel}>{['日', '月', '火', '水', '木', '金', '土'][d.getDay()]}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={styles.chartBody}>
                    {greenhouses.map(gh => (
                        <div key={gh.id} className={styles.row}>
                            <div className={styles.ghColumn} onClick={() => openNewCycle(gh)}>
                                <div className={styles.ghName}>{gh.name}</div>
                                <div className={styles.ghArea}>{gh.areaAcre}a</div>
                            </div>
                            <div className={styles.timelineRow} style={{ width: days.length * DAY_WIDTH }}>
                                {days.map(d => <div key={d.toString()} className={styles.gridCell} style={{ width: DAY_WIDTH }}></div>)}

                                {cycles.filter(c => c.greenhouseId === gh.id).map(cycle => {
                                    const renderBar = (start: string | null, end: string | null, color: string, label: string) => {
                                        const style = getBarStyle(start, end, color)
                                        if (!style) return null
                                        return (
                                            <div className={styles.bar} style={style} onClick={(e) => {
                                                e.stopPropagation()
                                                openEditCycle(cycle)
                                            }}>
                                                <span className={styles.barText}>{label}</span>
                                            </div>
                                        )
                                    }

                                    return (
                                        <div key={cycle.id}>
                                            {renderBar(cycle.disinfectionStart, cycle.disinfectionEnd, '#adb5bd', '土壌消毒')}
                                            {renderBar(cycle.plantingDate, cycle.lightsOffDate, '#4caf50', '定植〜消灯')}
                                            {renderBar(cycle.lightsOffDate, cycle.harvestStart, '#2196f3', '消灯〜収穫')}
                                            {renderBar(cycle.harvestStart, cycle.harvestEnd, '#ffc107', '収穫')}
                                        </div>
                                    )
                                })}
                            </div>
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
                💡 <b>ハウス名</b>をクリックで新規作成、<b>バー</b>をクリックで詳細修正が可能です。
            </p>
        </div>
    )
}

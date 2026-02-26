
'use client'

import { useState, useEffect } from 'react'
import styles from './modal.module.css'

interface Variety {
    name: string
    count: number
}

interface CropCycle {
    id?: string
    greenhouseId: string
    greenhouseName: string
    batchNumber: number | null
    varieties: Variety[]
    memo: string
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

interface Props {
    isOpen: boolean
    onClose: () => void
    onSave: (cycle: Partial<CropCycle>) => Promise<void>
    onDelete?: (id: string) => Promise<void>
    initialData: Partial<CropCycle>
}

export default function CycleModal({ isOpen, onClose, onSave, onDelete, initialData }: Props) {
    const [data, setData] = useState<Partial<CropCycle>>({
        batchNumber: 1,
        varieties: [{ name: '', count: 0 }],
        memo: '',
        ...initialData
    })

    useEffect(() => {
        if (isOpen) {
            setData({
                batchNumber: 1,
                varieties: [{ name: '', count: 0 }],
                memo: '',
                ...initialData
            })
        }
    }, [isOpen, initialData])

    if (!isOpen) return null

    const addVariety = () => {
        const varieties = [...(data.varieties || []), { name: '', count: 0 }]
        setData({ ...data, varieties })
    }

    const updateVariety = (index: number, field: keyof Variety, value: any) => {
        const varieties = [...(data.varieties || [])]
        varieties[index] = { ...varieties[index], [field]: field === 'count' ? Number(value) : value }
        setData({ ...data, varieties })
    }

    const removeVariety = (index: number) => {
        const varieties = (data.varieties || []).filter((_, i) => i !== index)
        setData({ ...data, varieties })
    }

    const formatDateForInput = (dateStr: string | null | undefined) => {
        if (!dateStr) return ''
        return new Date(dateStr).toISOString().split('T')[0]
    }

    const addDays = (dateStr: string | null | undefined, days: number) => {
        if (!dateStr) return null
        const date = new Date(dateStr)
        if (isNaN(date.getTime())) return null
        date.setDate(date.getDate() + days)
        return date.toISOString().split('T')[0]
    }

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <div className={styles.headerTitle}>
                        <h2>作付</h2>
                        <input
                            type="number"
                            min="1"
                            value={data.batchNumber || ''}
                            onChange={e => setData({ ...data, batchNumber: e.target.value ? Number(e.target.value) : null })}
                            placeholder="何作目"
                            className={styles.batchInput}
                        />
                        <span>作目</span>
                    </div>
                    <div className={styles.headerActions}>
                        {data.id && (
                            <button className={styles.deleteBtn} onClick={() => onDelete?.(data.id!)}>削除</button>
                        )}
                    </div>
                </div>

                <div className={styles.body}>
                    <section className={styles.section}>
                        <h3>品種・生体</h3>
                        <div className={styles.varietyList}>
                            {data.varieties?.map((v, i) => (
                                <div key={i} className={styles.varietyRow}>
                                    <input
                                        type="text"
                                        placeholder="品種名"
                                        value={v.name}
                                        onChange={e => updateVariety(i, 'name', e.target.value)}
                                    />
                                    <input
                                        type="number"
                                        placeholder="数"
                                        value={v.count || ''}
                                        onChange={e => updateVariety(i, 'count', e.target.value)}
                                    />
                                    <button className={styles.removeBtn} onClick={() => removeVariety(i)}>✕</button>
                                </div>
                            ))}
                        </div>
                        <button className={styles.addBtn} onClick={addVariety}>+品種を追加</button>
                    </section>

                    <section className={styles.section}>
                        <h3>栽培メモ</h3>
                        <textarea
                            className={styles.memoInput}
                            placeholder="気付いたことや作業内容など"
                            value={data.memo || ''}
                            onChange={e => setData({ ...data, memo: e.target.value })}
                        />
                    </section>

                    <div className={styles.grid}>
                        <div className={styles.field}>
                            <label>土壌消毒開始</label>
                            <input
                                type="date"
                                value={formatDateForInput(data.disinfectionStart)}
                                onChange={e => setData({ ...data, disinfectionStart: e.target.value })}
                            />
                        </div>
                        <div className={styles.field}>
                            <label>終了</label>
                            <input
                                type="date"
                                value={formatDateForInput(data.disinfectionEnd)}
                                onChange={e => setData({ ...data, disinfectionEnd: e.target.value })}
                            />
                        </div>
                        {data.isParentStock ? (
                            <>
                                <div className={styles.field}>
                                    <label>定植日</label>
                                    <input
                                        type="date"
                                        value={formatDateForInput(data.plantingDate)}
                                        onChange={e => {
                                            const plantingDate = e.target.value
                                            const pinchingDate = addDays(plantingDate, 14)
                                            const cuttingsStart = addDays(pinchingDate, 30)
                                            const cleanupDate = addDays(cuttingsStart, 90)
                                            setData({
                                                ...data,
                                                plantingDate,
                                                pinchingDate,
                                                cuttingsStart,
                                                cleanupDate
                                            })
                                        }}
                                    />
                                </div>
                                <div className={styles.field}>
                                    <label>摘芯</label>
                                    <input
                                        type="date"
                                        value={formatDateForInput(data.pinchingDate)}
                                        onChange={e => {
                                            const pinchingDate = e.target.value
                                            const cuttingsStart = addDays(pinchingDate, 30)
                                            const cleanupDate = addDays(cuttingsStart, 90)
                                            setData({
                                                ...data,
                                                pinchingDate,
                                                cuttingsStart,
                                                cleanupDate
                                            })
                                        }}
                                    />
                                </div>
                                <div className={styles.field}>
                                    <label>採穂開始</label>
                                    <input
                                        type="date"
                                        value={formatDateForInput(data.cuttingsStart)}
                                        onChange={e => {
                                            const cuttingsStart = e.target.value
                                            const cleanupDate = addDays(cuttingsStart, 90)
                                            setData({
                                                ...data,
                                                cuttingsStart,
                                                cleanupDate
                                            })
                                        }}
                                    />
                                </div>
                                <div className={styles.field}>
                                    <label>片付け</label>
                                    <input
                                        type="date"
                                        value={formatDateForInput(data.cleanupDate)}
                                        onChange={e => setData({ ...data, cleanupDate: e.target.value })}
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <div className={styles.field}>
                                    <label>定植日</label>
                                    <input
                                        type="date"
                                        value={formatDateForInput(data.plantingDate)}
                                        onChange={e => {
                                            const plantingDate = e.target.value
                                            const lightsOffDate = addDays(plantingDate, 25)
                                            const harvestStart = addDays(lightsOffDate, 49)
                                            const harvestEnd = addDays(harvestStart, 10)
                                            setData({
                                                ...data,
                                                plantingDate,
                                                lightsOffDate,
                                                harvestStart,
                                                harvestEnd
                                            })
                                        }}
                                    />
                                </div>
                                <div className={styles.field}>
                                    <label>消灯開始</label>
                                    <input
                                        type="date"
                                        value={formatDateForInput(data.lightsOffDate)}
                                        onChange={e => {
                                            const lightsOffDate = e.target.value
                                            const harvestStart = addDays(lightsOffDate, 49)
                                            const harvestEnd = addDays(harvestStart, 10)
                                            setData({
                                                ...data,
                                                lightsOffDate,
                                                harvestStart,
                                                harvestEnd
                                            })
                                        }}
                                    />
                                </div>
                                <div className={styles.field}>
                                    <label>収穫開始</label>
                                    <input
                                        type="date"
                                        value={formatDateForInput(data.harvestStart)}
                                        onChange={e => {
                                            const harvestStart = e.target.value
                                            const harvestEnd = addDays(harvestStart, 10)
                                            setData({
                                                ...data,
                                                harvestStart,
                                                harvestEnd
                                            })
                                        }}
                                    />
                                </div>
                                <div className={styles.field}>
                                    <label>終了</label>
                                    <input
                                        type="date"
                                        value={formatDateForInput(data.harvestEnd)}
                                        onChange={e => setData({ ...data, harvestEnd: e.target.value })}
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className={styles.footer}>
                    <button className={styles.cancelBtn} onClick={onClose}>キャンセル</button>
                    <button className={styles.saveBtn} onClick={() => onSave(data)}>保存する</button>
                </div>
            </div>
        </div>
    )
}

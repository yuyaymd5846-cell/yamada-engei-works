
'use client'

import { useState, useEffect } from 'react'
import styles from './page_client.module.css'

interface Greenhouse {
    id: string
    name: string
    areaAcre: number
    lastBatchNumber?: number | null
}

interface QuickWorkRecordProps {
    standardTime10a: number
    workName: string
}

export default function QuickWorkRecord({ standardTime10a, workName }: QuickWorkRecordProps) {
    const [greenhouses, setGreenhouses] = useState<Greenhouse[]>([])
    const [selectedGhId, setSelectedGhId] = useState<string>('')
    const [batchNumber, setBatchNumber] = useState<string>('1')
    const [spentTime, setSpentTime] = useState<string>('')
    const [loading, setLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        async function fetchData() {
            try {
                const [ghRes, recordsRes] = await Promise.all([
                    fetch('/api/greenhouse'),
                    fetch('/api/record')
                ])

                if (ghRes.ok && recordsRes.ok) {
                    const ghData = await ghRes.json()
                    const recordsData = await recordsRes.json()

                    const batchMap: Record<string, number> = {}
                    recordsData.forEach((r: any) => {
                        if (batchMap[r.greenhouseName] === undefined) {
                            batchMap[r.greenhouseName] = r.batchNumber
                        }
                    })

                    const enrichedGh = ghData.map((g: any) => ({
                        ...g,
                        lastBatchNumber: batchMap[g.name] || null
                    }))
                    setGreenhouses(enrichedGh)
                }
            } catch (err) {
                console.error('Failed to fetch data', err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const selectedGh = greenhouses.find(g => g.id === selectedGhId)

    // Pre-fill fields when greenhouse is selected
    useEffect(() => {
        if (selectedGh) {
            setBatchNumber(selectedGh.lastBatchNumber ? selectedGh.lastBatchNumber.toString() : '1')
            const target = (standardTime10a / 10) * selectedGh.areaAcre
            setSpentTime(target.toFixed(1))
        } else {
            setBatchNumber('1')
            setSpentTime('')
        }
    }, [selectedGhId, selectedGh, standardTime10a])

    async function handleSave() {
        if (!selectedGh) {
            alert('ハウスを選択してください')
            return
        }

        setIsSaving(true)
        try {
            const res = await fetch('/api/record', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workName,
                    greenhouseName: selectedGh.name,
                    batchNumber: parseInt(batchNumber) || 1,
                    areaAcre: selectedGh.areaAcre,
                    spentTime: parseFloat(spentTime) || 0,
                    note: '',
                    date: new Date().toISOString().split('T')[0]
                })
            })

            if (res.ok) {
                alert('作業実績を記録しました！')
                // Optional: refresh page or clear some state
            } else {
                const errorData = await res.json()
                alert(`保存に失敗しました: ${errorData.error}`)
            }
        } catch (err) {
            alert('エラーが発生しました')
        } finally {
            setIsSaving(false)
        }
    }

    if (loading) return <p>読み込み中...</p>

    return (
        <div className={styles.calculatorCard}>
            <label className={styles.label}>ハウス別 作業記録</label>
            <div className={styles.formSection}>
                <div className={styles.field}>
                    <label className={styles.subLabel}>ハウス</label>
                    <select
                        value={selectedGhId}
                        onChange={(e) => setSelectedGhId(e.target.value)}
                        className={styles.select}
                    >
                        <option value="">ハウスを選択...</option>
                        {greenhouses.map(gh => (
                            <option key={gh.id} value={gh.id}>
                                {gh.name} ({gh.areaAcre}a)
                            </option>
                        ))}
                    </select>
                </div>

                <div className={styles.fieldRow}>
                    <div className={styles.field}>
                        <label className={styles.subLabel}>何作目</label>
                        <input
                            type="number"
                            value={batchNumber}
                            onChange={e => setBatchNumber(e.target.value)}
                            className={styles.input}
                        />
                    </div>
                    <div className={styles.field}>
                        <label className={styles.subLabel}>時間 (h)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={spentTime}
                            onChange={e => setSpentTime(e.target.value)}
                            className={styles.input}
                        />
                    </div>
                </div>

                <button
                    className={styles.saveButton}
                    onClick={handleSave}
                    disabled={!selectedGh || isSaving}
                >
                    {isSaving ? '保存中...' : '📝 実績を記録する'}
                </button>

                {selectedGh && (
                    <p className={styles.calcHint}>
                        ※目標時間: {(standardTime10a / 10 * selectedGh.areaAcre).toFixed(1)}h
                    </p>
                )}
            </div>
        </div>
    )
}

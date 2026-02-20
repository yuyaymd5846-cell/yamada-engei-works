'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './QuickRecordForm.module.css'

interface QuickRecordFormProps {
    workName: string
    suggestedGreenhouses: { id: string, name: string, areaAcre: number, lastBatchNumber: number | null }[]
    defaultTime10a: number
}

export default function QuickRecordForm({ workName, suggestedGreenhouses, defaultTime10a }: QuickRecordFormProps) {
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')

    // Form State
    const [selectedGreenhouseIds, setSelectedGreenhouseIds] = useState<string[]>([])
    const [timeHours, setTimeHours] = useState('')
    const [batchNumber, setBatchNumber] = useState('')

    // Initialize/Update defaults when suggestions change or form opens
    useEffect(() => {
        if (suggestedGreenhouses.length > 0 && selectedGreenhouseIds.length === 0) {
            // Default to selecting ALL suggestions for convenience? Or just the first one?
            // User request implies bulk is common. Let's select all suggested ones by default.
            // Actually, let's just select the first one to be safe, or all. 
            // "Pre-fill" usually helps. Let's select ALL for maximum efficiency if they are "suggestions".
            setSelectedGreenhouseIds(suggestedGreenhouses.map(g => g.id))
        }
    }, [suggestedGreenhouses, isOpen])

    // Update estimated time AND batch number when selection changes
    useEffect(() => {
        if (selectedGreenhouseIds.length > 0) {
            // 1. Update Batch Number from the *first* selected house (assuming mostly same for batch tasks)
            // or maybe leaving it blank if mixed? For now, take first.
            const firstGH = suggestedGreenhouses.find(g => g.id === selectedGreenhouseIds[0])
            if (firstGH && firstGH.lastBatchNumber !== null && !batchNumber) {
                setBatchNumber(firstGH.lastBatchNumber.toString())
            }

            // 2. Update estimated hours (Sum of all selected)
            if (defaultTime10a > 0) {
                let totalArea = 0
                selectedGreenhouseIds.forEach(id => {
                    const gh = suggestedGreenhouses.find(g => g.id === id)
                    if (gh) totalArea += gh.areaAcre
                })
                const estimatedHours = (totalArea / 10) * defaultTime10a
                setTimeHours(estimatedHours.toFixed(2))
            }
        } else {
            setTimeHours('')
        }
    }, [selectedGreenhouseIds, defaultTime10a, suggestedGreenhouses])

    const toggleSelection = (id: string) => {
        setSelectedGreenhouseIds(prev =>
            prev.includes(id)
                ? prev.filter(p => p !== id)
                : [...prev, id]
        )
    }

    const toggleSelectAll = () => {
        if (selectedGreenhouseIds.length === suggestedGreenhouses.length) {
            setSelectedGreenhouseIds([])
        } else {
            setSelectedGreenhouseIds(suggestedGreenhouses.map(g => g.id))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsSubmitting(true)

        try {
            if (selectedGreenhouseIds.length === 0) {
                throw new Error('ハウスが選択されていません')
            }

            // Calculate time per house proportional to area? 
            // Or just divide total time equally? Or assign calculated time?
            // User inputs TOTAL actual time for the batch.
            // We should distribute it? Or record calculated target for each?
            // Usually "Work Record" needs actual time per house.
            // If user inputs 1.5h for 3 houses, we should probably record 0.5h each?
            // OR, weigh by area.

            // Let's weigh by area.
            let totalSelectedArea = 0
            selectedGreenhouseIds.forEach(id => {
                const gh = suggestedGreenhouses.find(g => g.id === id)
                if (gh) totalSelectedArea += gh.areaAcre
            })

            const totalHours = parseFloat(timeHours) || 0

            const payload = selectedGreenhouseIds.map(id => {
                const gh = suggestedGreenhouses.find(g => g.id === id)!
                // Distribute duration based on area ratio
                const ratio = totalSelectedArea > 0 ? gh.areaAcre / totalSelectedArea : 1 / selectedGreenhouseIds.length
                const hoursForHouse = parseFloat((totalHours * ratio).toFixed(2))

                return {
                    workName,
                    greenhouseName: gh.name,
                    batchNumber: batchNumber ? parseInt(batchNumber) : null,
                    spentTime: hoursForHouse, // hr
                    areaAcre: gh.areaAcre,
                    date: new Date().toISOString()
                }
            })

            const res = await fetch('/api/record', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            if (!res.ok) {
                throw new Error('保存に失敗しました')
            }

            // Success
            setIsOpen(false)
            setTimeHours('')
            setBatchNumber('')
            router.refresh()

        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className={styles.triggerButton}
            >
                📝 記録する
            </button>
        )
    }

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            {error && <p className={styles.error}>{error}</p>}

            <div className={styles.row}>
                <div className={styles.group} style={{ flex: 2 }}>
                    <div className={styles.labelRow}>
                        <label>ハウス ({selectedGreenhouseIds.length})</label>
                        <button type="button" onClick={toggleSelectAll} className={styles.selectAllBtn}>
                            {selectedGreenhouseIds.length === suggestedGreenhouses.length ? '全解除' : '全選択'}
                        </button>
                    </div>
                    <div className={styles.badgeGrid}>
                        {suggestedGreenhouses.map(g => (
                            <button
                                key={g.id}
                                type="button"
                                className={`${styles.badge} ${selectedGreenhouseIds.includes(g.id) ? styles.selected : ''}`}
                                onClick={() => toggleSelection(g.id)}
                            >
                                {g.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={styles.group} style={{ flex: 1 }}>
                    <label>何作目</label>
                    <input
                        type="number"
                        min="1"
                        value={batchNumber}
                        onChange={(e) => setBatchNumber(e.target.value)}
                        placeholder="例: 1"
                        className={styles.input}
                    />
                </div>
            </div>

            <div className={styles.row}>
                <div className={styles.group}>
                    <label>合計時間 (時間)</label>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={timeHours}
                        onChange={(e) => setTimeHours(e.target.value)}
                        placeholder="例: 1.5"
                        className={styles.input}
                    />
                </div>
                <div className={styles.actions}>
                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className={styles.cancelButton}
                        disabled={isSubmitting}
                    >
                        ✕
                    </button>
                    <button
                        type="submit"
                        className={styles.submitButton}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? '保存中...' : `一括保存 (${selectedGreenhouseIds.length})`}
                    </button>
                </div>
            </div>
        </form>
    )
}

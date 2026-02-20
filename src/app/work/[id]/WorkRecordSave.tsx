
'use client'

import { useState, useEffect } from 'react'
import styles from './record.module.css'

interface WorkRecordSaveProps {
    workName: string
    defaultArea?: number
    defaultTime?: number
    greenhouseName?: string
    initialNote?: string
    lastBatchNumber?: number | null
}

export default function WorkRecordSave({
    workName,
    defaultArea = 10,
    defaultTime = 0,
    greenhouseName = '',
    initialNote = '',
    lastBatchNumber = null
}: WorkRecordSaveProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [batchNumber, setBatchNumber] = useState(lastBatchNumber ? lastBatchNumber.toString() : '1')
    const [spentTime, setSpentTime] = useState(defaultTime.toString())
    const [note, setNote] = useState(initialNote)
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])

    useEffect(() => {
        if (lastBatchNumber !== null) {
            setBatchNumber(lastBatchNumber.toString())
        }
    }, [lastBatchNumber])

    // 目標時間が計算・変更されたら、入力欄の初期値も更新する
    useEffect(() => {
        setSpentTime(defaultTime.toString())
    }, [defaultTime])

    async function handleSave() {
        if (!greenhouseName) {
            alert('ハウスを選択してください')
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/record', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workName,
                    greenhouseName,
                    batchNumber: parseInt(batchNumber) || 1,
                    areaAcre: defaultArea,
                    spentTime: parseFloat(spentTime) || 0,
                    note,
                    date
                })
            })

            if (res.ok) {
                alert('作業実績を記録しました！')
                setIsOpen(false)
            } else {
                const errorData = await res.json()
                alert(`保存に失敗しました: ${errorData.error}`)
            }
        } catch (err) {
            alert('エラーが発生しました')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) {
        return (
            <button
                className={styles.openBtn}
                onClick={() => setIsOpen(true)}
            >
                📝 この内容で作業を記録する
            </button>
        )
    }

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal}>
                <h3>作業実績の記録</h3>
                <p className={styles.summary}>{workName} - {greenhouseName}</p>

                <div className={styles.form}>
                    <div className={styles.formGrid}>
                        <div className={styles.field}>
                            <label>実施日</label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
                        </div>
                        <div className={styles.field}>
                            <label>何作目</label>
                            <input
                                type="number"
                                value={batchNumber}
                                onChange={e => setBatchNumber(e.target.value)}
                                placeholder="1"
                            />
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label className={styles.highlightLabel}>作業時間 (時間)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={spentTime}
                            onChange={e => setSpentTime(e.target.value)}
                            className={styles.highlightInput}
                            required
                        />
                    </div>

                    <div className={styles.field}>
                        <label>備考・気づき</label>
                        <textarea
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            placeholder="例: 生育良好"
                            rows={3}
                        />
                    </div>

                    <div className={styles.actions}>
                        <button onClick={handleSave} disabled={loading} className={styles.saveBtn}>
                            {loading ? '保存中...' : '記録を保存'}
                        </button>
                        <button onClick={() => setIsOpen(false)} className={styles.cancelBtn}>
                            キャンセル
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

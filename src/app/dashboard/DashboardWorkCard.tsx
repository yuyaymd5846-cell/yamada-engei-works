'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from './dashboard.module.css'
import QuickRecordForm from './QuickRecordForm'

interface TargetItem {
    greenhouseId: string
    greenhouseName: string
    areaAcre: number
    targetTime: number
    lastBatchNumber: number | null
    isUrgent?: boolean
    daysPassed?: number
}

interface ManualData {
    id: string
    workName: string
    stage: string
    purpose: string
    timingStandard: string
    requiredTime10a: number
}

export interface WorkCardData {
    manual: ManualData
    displayWorkName?: string
    targets: TargetItem[]
    targetTotalTime: number
    actualTime: number
    requiredTime10a: number
    isCompleted: boolean
    hasUrgentTarget?: boolean
}

function getTodayDateStr() {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
}

export default function DashboardWorkCard({ workTarget }: { workTarget: WorkCardData }) {
    const {
        manual, displayWorkName, targets,
        targetTotalTime, actualTime, requiredTime10a,
        isCompleted, hasUrgentTarget
    } = workTarget

    const cardKey = `dashboard_done_${getTodayDateStr()}_${displayWorkName || manual.workName}`
    const [manuallyDone, setManuallyDone] = useState(false)

    useEffect(() => {
        try {
            setManuallyDone(localStorage.getItem(cardKey) === 'true')
        } catch { /* storageが使えない環境では無視 */ }
    }, [cardKey])

    const markDone = async () => {
        try {
            // ローカルストレージにも保存（即時フィードバック用）
            localStorage.setItem(cardKey, 'true')
            setManuallyDone(true)

            // APIを介してDBに保存（ spentTime: 0 ）
            // これにより翌日以降も「完了済み」として判定可能になる
            const recordData = {
                workName: manual.workName,
                greenhouseName: targets[0]?.greenhouseName || '不明',
                batchNumber: targets[0]?.lastBatchNumber || null,
                spentTime: 0,
                note: 'ダッシュボードから完了',
                date: new Date().toISOString()
            }

            const res = await fetch('/api/record', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(recordData)
            })

            if (!res.ok) {
                console.error('Failed to save completion record')
                // 失敗した場合は localStorage だけ残る（とりあえず今日の分は消える）
            }
        } catch (error) {
            console.error('Error marking as done:', error)
        }
    }

    const unmarkDone = () => {
        try { localStorage.removeItem(cardKey) } catch { }
        setManuallyDone(false)
    }

    const effectivelyDone = isCompleted || manuallyDone

    return (
        <div className={`${styles.workCard} ${effectivelyDone ? styles.completedCard : ''}`}>
            <div className={styles.cardHeader}>
                <div className={styles.workTitleRow}>
                    <h3 className={styles.workName}>{displayWorkName || manual.workName}</h3>
                    {effectivelyDone && (
                        <span className={styles.completedBadge}>
                            {isCompleted ? '✅ 完了' : '✓ 完了'}
                        </span>
                    )}
                </div>
                <span className={styles.stageLabel}>{manual.stage}</span>
            </div>

            <p className={styles.purpose}>{manual.purpose}</p>

            <div className={styles.manualTarget}>
                <span className={styles.targetIcon}>🎯</span>
                <span className={styles.targetLabel}>目標:</span>
                <span className={styles.targetText}>{manual.timingStandard}</span>
            </div>

            <div className={styles.targetComparison}>
                <div className={styles.targetBox}>
                    <span className={styles.subText}>
                        目標合計: {targetTotalTime > 0 ? `${targetTotalTime.toFixed(2)}h` : '-'}
                    </span>
                </div>
                <div className={styles.targetBox}>
                    <span className={styles.subText}>本日の実績: </span>
                    <span className={styles.actualTotal} data-complete={String(effectivelyDone)}>
                        {actualTime.toFixed(2)}h
                    </span>
                </div>
            </div>

            {targets.length > 0 && (
                <div className={styles.targetsList}>
                    {targets.map((t, idx) => (
                        <div key={idx} className={`${styles.targetBadge} ${t.isUrgent ? styles.urgentTargetBadge : ''}`}>
                            <span className={styles.targetGH}>{t.greenhouseName}</span>
                            {t.isUrgent && (
                                <span className={styles.urgentTag}>
                                    ⚠️ {t.daysPassed === 999 ? '散布歴なし' : `${t.daysPassed}日経過`}
                                </span>
                            )}
                            <span className={styles.targetTimeValue}>{t.targetTime.toFixed(2)}h</span>
                        </div>
                    ))}
                </div>
            )}

            <div className={styles.cardFooter}>
                <div className={styles.footerInfo}>
                    {requiredTime10a > 0 ? (
                        <span className={styles.standardTime}>
                            目安: {requiredTime10a}h/{(manual.workName === 'かん水' || manual.workName === '薬剤散布') ? '棟' : '10a'}
                        </span>
                    ) : <span />}
                    <Link href={`/work/${manual.id}`} className={styles.link}>📖 手順を見る</Link>
                </div>

                {/* 手動完了チェック（作業記録が未入力の場合のみ表示） */}
                {!isCompleted && (
                    <div className={styles.checkRow}>
                        {manuallyDone ? (
                            <button onClick={unmarkDone} className={styles.undoneBtn}>
                                ↩ 取り消す
                            </button>
                        ) : (
                            <button onClick={markDone} className={styles.doneBtn}>
                                ✓ 完了にする
                            </button>
                        )}
                    </div>
                )}

                <QuickRecordForm
                    workName={manual.workName}
                    suggestedGreenhouses={targets.map(t => ({
                        id: t.greenhouseId,
                        name: t.greenhouseName,
                        areaAcre: t.areaAcre,
                        lastBatchNumber: t.lastBatchNumber
                    }))}
                    defaultTime10a={requiredTime10a}
                />
            </div>
        </div>
    )
}

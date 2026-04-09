'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import styles from './dashboard.module.css'

const QuickRecordForm = dynamic(() => import('./QuickRecordForm'), {
    ssr: false,
    loading: () => <div className={styles.quickRecordLoading}>入力フォームを準備中...</div>,
})

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
        manual,
        displayWorkName,
        targets,
        targetTotalTime,
        actualTime,
        requiredTime10a,
        isCompleted,
    } = workTarget

    const cardKey = `dashboard_done_${getTodayDateStr()}_${displayWorkName || manual.workName}`
    const [manuallyDone, setManuallyDone] = useState(false)
    const [showRecordForm, setShowRecordForm] = useState(false)

    useEffect(() => {
        try {
            setManuallyDone(localStorage.getItem(cardKey) === 'true')
        } catch {
            // Ignore storage access errors in restricted environments.
        }
    }, [cardKey])

    const markDone = async () => {
        try {
            localStorage.setItem(cardKey, 'true')
            setManuallyDone(true)

            const recordData = {
                workName: manual.workName,
                greenhouseName: targets[0]?.greenhouseName || '未指定',
                batchNumber: targets[0]?.lastBatchNumber || null,
                spentTime: 0,
                note: 'ダッシュボードで完了に設定',
                date: new Date().toISOString(),
            }

            const res = await fetch('/api/record', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(recordData),
            })

            if (!res.ok) {
                console.error('Failed to save completion record')
            }
        } catch (error) {
            console.error('Error marking as done:', error)
        }
    }

    const unmarkDone = () => {
        try {
            localStorage.removeItem(cardKey)
        } catch {
            // Ignore storage access errors in restricted environments.
        }
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
                            {isCompleted ? '記録済み' : '完了扱い'}
                        </span>
                    )}
                </div>
                <span className={styles.stageLabel}>{manual.stage}</span>
            </div>

            <p className={styles.purpose}>{manual.purpose}</p>

            <div className={styles.manualTarget}>
                <span className={styles.targetIcon}>⏱</span>
                <span className={styles.targetLabel}>目安</span>
                <span className={styles.targetText}>{manual.timingStandard}</span>
            </div>

            <div className={styles.targetComparison}>
                <div className={styles.targetBox}>
                    <span className={styles.subText}>
                        目標時間 {targetTotalTime > 0 ? `${targetTotalTime.toFixed(2)}h` : '-'}
                    </span>
                </div>
                <div className={styles.targetBox}>
                    <span className={styles.subText}>本日の記録:</span>
                    <span className={styles.actualTotal} data-complete={String(effectivelyDone)}>
                        {actualTime.toFixed(2)}h
                    </span>
                </div>
            </div>

            {targets.length > 0 && (
                <div className={styles.targetsList}>
                    {targets.map((target, idx) => (
                        <div key={idx} className={`${styles.targetBadge} ${target.isUrgent ? styles.urgentTargetBadge : ''}`}>
                            <span className={styles.targetGH}>{target.greenhouseName}</span>
                            {target.isUrgent && (
                                <span className={styles.urgentTag}>
                                    緊急 {target.daysPassed === 999 ? '未実施' : `${target.daysPassed}日経過`}
                                </span>
                            )}
                            <span className={styles.targetTimeValue}>{target.targetTime.toFixed(2)}h</span>
                        </div>
                    ))}
                </div>
            )}

            <div className={styles.cardFooter}>
                <div className={styles.footerInfo}>
                    {manual.workName === '栽培管理' ? (
                        <span className={styles.standardTime}>標準 0.25h/ハウス</span>
                    ) : requiredTime10a > 0 ? (
                        <span className={styles.standardTime}>
                            標準 {requiredTime10a}h/
                            {(manual.workName === 'かん水' || manual.workName === '農薬散布') ? '棟' : '10a'}
                        </span>
                    ) : (
                        <span />
                    )}
                    <Link href={`/work/${manual.id}`} className={styles.link}>詳細を見る</Link>
                </div>

                {!isCompleted && (
                    <div className={styles.checkRow}>
                        {manuallyDone ? (
                            <button onClick={unmarkDone} className={styles.undoneBtn}>
                                完了扱いを戻す
                            </button>
                        ) : (
                            <button onClick={markDone} className={styles.doneBtn}>
                                完了にする
                            </button>
                        )}
                    </div>
                )}

                {showRecordForm ? (
                    <QuickRecordForm
                        workName={manual.workName}
                        suggestedGreenhouses={targets.map((target) => ({
                            id: target.greenhouseId,
                            name: target.greenhouseName,
                            areaAcre: target.areaAcre,
                            lastBatchNumber: target.lastBatchNumber,
                        }))}
                        defaultTime10a={requiredTime10a}
                        defaultOpen
                    />
                ) : (
                    <button
                        type="button"
                        className={styles.quickRecordLauncher}
                        onClick={() => setShowRecordForm(true)}
                    >
                        記録フォームを開く
                    </button>
                )}
            </div>
        </div>
    )
}

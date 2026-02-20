'use client'
export const dynamic = 'force-dynamic'


import { useState, useEffect } from 'react';
import styles from './rotation.module.css';
import RotationEditModal from './RotationEditModal';

interface Pesticide {
    name: string;
    dilution: string;
}

interface RotationStage {
    id: string;
    label: string;
    pesticides: Pesticide[];
}

export default function RotationPage() {
    const [rotations, setRotations] = useState<RotationStage[]>([]);
    const [status, setStatus] = useState<Record<string, { date: string, id: string }>>({});
    const [loading, setLoading] = useState(true);
    const [recording, setRecording] = useState<string | null>(null);

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingRotation, setEditingRotation] = useState<RotationStage | null>(null);

    // Fetch Rotations from API
    const fetchRotations = async () => {
        try {
            const res = await fetch('/api/rotation/list');
            if (res.ok) {
                const data = await res.json();
                setRotations(data);
            }
        } catch (err) {
            console.error('Failed to fetch rotations:', err);
        }
    };

    // Fetch Rotation Status (Always for "全ハウス")
    const fetchStatus = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/rotation/status?greenhouseName=全ハウス');
            const data = await res.json();
            setStatus(data);
        } catch (err) {
            console.error('Failed to fetch status:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRotations();
        fetchStatus();
    }, []);

    const handleCheck = async (label: string) => {
        if (recording) return;

        const currentStatus = status[label];
        const isCheckedToday = currentStatus && new Date(currentStatus.date).toDateString() === new Date().toDateString();

        if (isCheckedToday) {
            // UNCHECK logic: Delete the record
            if (!confirm(`ローテーション ${label} （本日分）の記録を削除しますか？`)) return;

            setRecording(label);
            try {
                const res = await fetch(`/api/rotation/status?id=${currentStatus.id}`, {
                    method: 'DELETE'
                });

                if (res.ok) {
                    await fetchStatus();
                } else {
                    alert('削除に失敗しました');
                }
            } catch (err) {
                console.error(err);
                alert('エラーが発生しました');
            } finally {
                setRecording(null);
            }
        } else {
            // CHECK logic: Record new spray
            if (!confirm(`ローテーション ${label} の散布を記録しますか？\n（本日分、全ハウスの実績として保存されます）`)) return;

            setRecording(label);
            try {
                const res = await fetch('/api/rotation/status', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        rotationLabel: label
                    })
                });

                if (res.ok) {
                    await fetchStatus();
                } else {
                    alert('記録に失敗しました');
                }
            } catch (err) {
                console.error(err);
                alert('エラーが発生しました');
            } finally {
                setRecording(null);
            }
        }
    };

    const handleEditClick = (stage: RotationStage) => {
        setEditingRotation(stage);
        setIsEditModalOpen(true);
    };

    const handleEditSave = async () => {
        await fetchRotations(); // Refresh list after edit
    };

    const formatDate = (isoString?: string) => {
        if (!isoString) return '-';
        return new Intl.DateTimeFormat('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(new Date(isoString));
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>薬剤散布ローテーション</h1>
                <p>防除効果を維持し、抵抗性の発達を防ぐための薬液ローテーション表です。</p>
            </header>

            <div className={styles.controls}>
                <div className={styles.info}>
                    <small>※ チェックを入れると本日分（全ハウス共通）が記録されます。既にあるチェックを外すと記録が削除されます。</small>
                </div>
            </div>

            <div className={styles.grid}>
                {rotations.map((stage) => {
                    const statusInfo = status[stage.label];
                    const isToday = statusInfo && new Date(statusInfo.date).toDateString() === new Date().toDateString();

                    return (
                        <div key={stage.id} className={styles.card}>
                            <div className={styles.cardHeader}>
                                <div className={styles.stageNumber}>{stage.label}</div>
                                <h2>ローテーション {stage.label}</h2>
                                <button className={styles.editBtn} onClick={() => handleEditClick(stage)}>
                                    編集
                                </button>
                                <input
                                    type="checkbox"
                                    className={styles.checkbox}
                                    checked={!!isToday}
                                    disabled={recording === stage.label}
                                    onChange={() => handleCheck(stage.label)}
                                    title={isToday ? "記録を削除" : "散布完了を記録"}
                                />
                            </div>
                            <ul className={styles.pesticideList}>
                                {stage.pesticides.map((p, idx) => (
                                    <li key={idx} className={styles.pesticideItem}>
                                        <span className={styles.pesticideName}>{p.name}</span>
                                        {p.dilution && (
                                            <span className={styles.dilution}>{p.dilution}</span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                            <div className={styles.statusInfo}>
                                <div className={styles.lastSpray}>
                                    <span>最終散布日</span>
                                    {loading ? (
                                        <span className={styles.loading}>...</span>
                                    ) : statusInfo ? (
                                        <span className={styles.dateValue}>{formatDate(statusInfo.date)}</span>
                                    ) : (
                                        <span className={styles.noRecord}>記録なし</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {editingRotation && (
                <RotationEditModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    rotationId={editingRotation.id}
                    rotationLabel={editingRotation.label}
                    initialPesticides={editingRotation.pesticides}
                    onSave={handleEditSave}
                />
            )}
        </div>
    );
}

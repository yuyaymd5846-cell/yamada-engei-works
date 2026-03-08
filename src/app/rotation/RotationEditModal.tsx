
'use client'

import { useState } from 'react';
import styles from './rotation.module.css';

interface Pesticide {
    name: string;
    dilution: string;
}

interface RotationEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    rotationId: string;
    rotationLabel: string;
    initialPesticides: Pesticide[];
    onSave: () => void;
}

export default function RotationEditModal({
    isOpen,
    onClose,
    rotationId,
    rotationLabel,
    initialPesticides,
    onSave
}: RotationEditModalProps) {
    const [pesticides, setPesticides] = useState<Pesticide[]>(initialPesticides);
    const [saving, setSaving] = useState(false);

    if (!isOpen) return null;

    const handleChange = (index: number, field: keyof Pesticide, value: string) => {
        const newPesticides = [...pesticides];
        newPesticides[index] = { ...newPesticides[index], [field]: value };
        setPesticides(newPesticides);
    };

    const handleAddRow = () => {
        setPesticides([...pesticides, { name: '', dilution: '' }]);
    };

    const handleDeleteRow = (index: number) => {
        const newPesticides = pesticides.filter((_, i) => i !== index);
        setPesticides(newPesticides);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/rotation/${rotationId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pesticides })
            });

            if (res.ok) {
                onSave();
                onClose();
            } else {
                alert('保存に失敗しました');
            }
        } catch (err) {
            console.error(err);
            alert('エラーが発生しました');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    <h3>ローテーション {rotationLabel} の編集</h3>
                    <button onClick={onClose} className={styles.closeBtn}>×</button>
                </div>

                <div className={styles.modalBody}>
                    <table className={styles.editTable}>
                        <thead>
                            <tr>
                                <th>薬剤名</th>
                                <th>倍率</th>
                                <th style={{ width: '60px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {pesticides.map((p, idx) => (
                                <tr key={idx}>
                                    <td>
                                        <input
                                            type="text"
                                            value={p.name}
                                            onChange={(e) => handleChange(idx, 'name', e.target.value)}
                                            placeholder="薬剤名"
                                            className={styles.input}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="text"
                                            value={p.dilution}
                                            onChange={(e) => handleChange(idx, 'dilution', e.target.value)}
                                            placeholder="倍率"
                                            className={styles.input}
                                        />
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => handleDeleteRow(idx)}
                                            className={styles.deleteBtn}
                                            title="削除"
                                        >
                                            🗑️
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <button onClick={handleAddRow} className={styles.addBtn}>+ 薬剤を追加</button>
                </div>

                <div className={styles.modalFooter}>
                    <button onClick={onClose} className={styles.cancelBtn}>キャンセル</button>
                    <button onClick={handleSave} disabled={saving} className={styles.saveBtn}>
                        {saving ? '保存中...' : '保存する'}
                    </button>
                </div>
            </div>
        </div>
    );
}

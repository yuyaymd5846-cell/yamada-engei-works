
'use client'

import { useState, useEffect } from 'react'
import styles from './work-detail.module.css'

interface Greenhouse {
    id: string
    name: string
    areaAcre: number
}

export default function AIConsultation({ workName }: { workName: string }) {
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<string | null>(null)
    const [greenhouses, setGreenhouses] = useState<Greenhouse[]>([])

    useEffect(() => {
        if (isOpen) {
            fetch('/api/greenhouse')
                .then(res => res.json())
                .then(data => setGreenhouses(data))
                .catch(err => console.error('Failed to fetch greenhouses', err))
        }
    }, [isOpen])

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setResult(null)

        const formData = new FormData(e.currentTarget)
        const data = {
            work_name: workName,
            house: formData.get('house'),
            variety: formData.get('variety'),
            days_after_planting: Number(formData.get('days')),
            plant_height_cm: Number(formData.get('height')),
            target_grade: '秀2L'
        }

        try {
            const res = await fetch('/api/ai/evaluate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
            const json = await res.json()
            setResult(json.analysis || json.error)
        } catch (err) {
            setResult('エラーが発生しました。')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) {
        return (
            <button onClick={() => setIsOpen(true)} className={styles.aiButton}>
                🤖 AIに相談する (Beta)
            </button>
        )
    }

    return (
        <div className={styles.aiContainer}>
            <form onSubmit={handleSubmit} className={styles.aiForm}>
                <div className={styles.formRow}>
                    <label>
                        ハウス:
                        <select name="house" required className={styles.aiSelect}>
                            <option value="">選択してください</option>
                            {greenhouses.map(gh => (
                                <option key={gh.id} value={gh.name}>{gh.name}</option>
                            ))}
                        </select>
                    </label>
                    <label>品種: <input name="variety" type="text" placeholder="アリエル" required /></label>
                </div>
                <div className={styles.formRow}>
                    <label>経過日数: <input name="days" type="number" placeholder="30" required /></label>
                    <label>草丈(cm): <input name="height" type="number" placeholder="50" required /></label>
                </div>

                <div className={styles.formActions}>
                    <button type="submit" disabled={loading} className={styles.submitButton}>
                        {loading ? '診断中...' : '診断を実行'}
                    </button>
                    <button type="button" onClick={() => setIsOpen(false)} className={styles.cancelButton}>
                        キャンセル
                    </button>
                </div>
            </form>

            {result && (
                <div className={styles.aiResult}>
                    <h4>AI診断結果</h4>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{result}</div>
                </div>
            )}
        </div>
    )
}

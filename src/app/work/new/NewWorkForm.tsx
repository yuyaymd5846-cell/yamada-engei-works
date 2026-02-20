
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './new.module.css'

import ImageUpload from '@/app/components/ui/ImageUpload'

export default function NewWorkForm() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [actionSteps, setActionSteps] = useState('')

    function handleImageUpload(url: string) {
        const markdownImage = `\n![写真](${url})\n`
        setActionSteps((prev) => prev + markdownImage)
        alert('写真を手順の最後に追加しました！')
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        // Override actionSteps from form data with state value
        formData.set('actionSteps', actionSteps);
        const data = Object.fromEntries(formData.entries())

        try {
            const res = await fetch('/api/work', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })

            if (!res.ok) throw new Error('登録に失敗しました')

            const newWork = await res.json()
            router.push(`/work/${newWork.id}`)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.grid}>
                <div className={styles.section}>
                    <h3>基本情報</h3>
                    <div className={styles.field}>
                        <label>作業名</label>
                        <input name="workName" placeholder="例: ヤゴかき" required />
                    </div>
                    <div className={styles.field}>
                        <label>生育ステージ</label>
                        <input name="stage" placeholder="例: 成長期" required />
                    </div>
                    <div className={styles.field}>
                        <label>難易度 (1-5)</label>
                        <input name="difficultyLevel" type="number" min="1" max="5" defaultValue="3" required />
                    </div>
                    <div className={styles.field}>
                        <label>標準時間 (h/10a)</label>
                        <input name="requiredTime10a" type="number" step="0.01" defaultValue="10.0" required />
                    </div>
                </div>

                <div className={styles.section}>
                    <h3>メディア (URL)</h3>
                    <div className={styles.field}>
                        <label>画像URL</label>
                        <input name="imageUrl" placeholder="https://..." />
                    </div>
                    <div className={styles.field}>
                        <label>動画URL</label>
                        <input name="videoUrl" placeholder="https://..." />
                    </div>
                </div>
            </div>

            <div className={styles.field}>
                <label>作業目的</label>
                <textarea name="purpose" placeholder="なぜこの作業を行うのか..." rows={3} required />
            </div>

            <div className={styles.field}>
                <label>目標</label>
                <textarea name="timingStandard" placeholder="どのような状態・技術レベルを目指すか..." rows={3} required />
            </div>

            <div className={styles.field}>
                <label>作業手順 (Markdown対応)</label>
                <p className={styles.hint}>※画像挿入: ![説明](画像のURL) と入力してください。</p>
                <textarea name="actionSteps" placeholder="1. ...&#10;2. ...&#10;&#10;![作業の様子](URL) で写真を挿入できます。" rows={10} required />
            </div>

            <div className={styles.grid}>
                <div className={styles.field}>
                    <label>未実施リスク</label>
                    <textarea name="riskIfNotDone" placeholder="行わなかった場合に何が起きるか..." rows={3} required />
                </div>
                <div className={styles.field}>
                    <label>利益影響（単価等）</label>
                    <textarea name="impactOnProfit" placeholder="品質や価格にどう影響するか..." rows={3} required />
                </div>
            </div>

            <div className={styles.actions}>
                <button type="submit" disabled={loading} className={styles.saveButton}>
                    {loading ? '登録中...' : '新規登録'}
                </button>
            </div>
        </form>
    )
}

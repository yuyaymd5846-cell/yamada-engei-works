
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './edit.module.css'

import ImageUpload from '@/app/components/ui/ImageUpload'

export default function EditForm({ work }: { work: any }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [actionSteps, setActionSteps] = useState(work.actionSteps)

    function handleImageUpload(url: string) {
        const markdownImage = `\n![写真](${url})\n`
        setActionSteps((prev: string) => prev + markdownImage)
        alert('写真を手順の最後に追加しました！')
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const data = Object.fromEntries(formData.entries())
        data.actionSteps = actionSteps // Ensure the state value is used for actionSteps

        try {
            const res = await fetch(`/api/work/${work.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })

            if (!res.ok) throw new Error('更新に失敗しました')

            router.push(`/work/${work.id}`)
            router.refresh()
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
                        <input name="workName" defaultValue={work.workName} required />
                    </div>
                    <div className={styles.field}>
                        <label>生育ステージ</label>
                        <input name="stage" defaultValue={work.stage} required />
                    </div>
                    <div className={styles.field}>
                        <label>難易度 (1-5)</label>
                        <input name="difficultyLevel" type="number" min="1" max="5" defaultValue={work.difficultyLevel} required />
                    </div>
                    <div className={styles.field}>
                        <label>標準時間 (h/10a)</label>
                        <input name="requiredTime10a" type="number" step="0.01" defaultValue={work.requiredTime10a} required />
                    </div>
                </div>

                <div className={styles.section}>
                    <h3>メディア (URL)</h3>
                    <div className={styles.field}>
                        <label>画像URL</label>
                        <input name="imageUrl" defaultValue={work.imageUrl || ''} placeholder="https://..." />
                    </div>
                    <div className={styles.field}>
                        <label>動画URL (YouTubeなど)</label>
                        <input name="videoUrl" defaultValue={work.videoUrl || ''} placeholder="https://..." />
                    </div>
                </div>
            </div>

            <div className={styles.field}>
                <label>作業目的</label>
                <textarea name="purpose" defaultValue={work.purpose} rows={3} required />
            </div>

            <div className={styles.field}>
                <label>目標</label>
                <textarea name="timingStandard" defaultValue={work.timingStandard} rows={3} required />
            </div>

            <div className={styles.field}>
                <label>作業手順 (Markdown対応)</label>
                <p className={styles.hint}>※画像挿入: ![説明](画像のURL) と入力してください。</p>
                <textarea name="actionSteps" defaultValue={work.actionSteps} rows={10} required />
            </div>

            <div className={styles.grid}>
                <div className={styles.field}>
                    <label>未実施リスク</label>
                    <textarea name="riskIfNotDone" defaultValue={work.riskIfNotDone} rows={3} required />
                </div>
                <div className={styles.field}>
                    <label>利益影響（単価等）</label>
                    <textarea name="impactOnProfit" defaultValue={work.impactOnProfit} rows={3} required />
                </div>
            </div>

            <div className={styles.actions}>
                <button type="submit" disabled={loading} className={styles.saveButton}>
                    {loading ? '保存中...' : '変更を保存'}
                </button>
            </div>
        </form>
    )
}

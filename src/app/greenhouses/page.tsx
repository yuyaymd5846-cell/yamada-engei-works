
'use client'

import { useState, useEffect } from 'react'
import styles from './greenhouse.module.css'

interface Greenhouse {
    id: string
    name: string
    areaAcre: number
}

export default function GreenhouseMaster() {
    const [greenhouses, setGreenhouses] = useState<Greenhouse[]>([])
    const [name, setName] = useState('')
    const [area, setArea] = useState('')
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    const fetchGreenhouses = async () => {
        try {
            const res = await fetch('/api/greenhouse')
            const data = await res.json()
            setGreenhouses(data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchGreenhouses()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const res = await fetch('/api/greenhouse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, areaAcre: parseFloat(area) })
            })
            if (res.ok) {
                setName('')
                setArea('')
                fetchGreenhouses()
            }
        } catch (err) {
            alert('登録に失敗しました')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('本当に削除しますか？')) return
        try {
            const res = await fetch(`/api/greenhouse?id=${id}`, {
                method: 'DELETE'
            })
            if (res.ok) {
                fetchGreenhouses()
            } else {
                alert('削除に失敗しました')
            }
        } catch (err) {
            console.error(err)
            alert('エラーが発生しました')
        }
    }

    if (loading) return <div className={styles.container}>読み込み中...</div>

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>ハウス（圃場）マスタ登録</h1>
                <p>各ハウスの名称と面積を登録します。面積は目標時間の計算に使用されます。</p>
            </header>

            <section className={styles.formSection}>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.field}>
                        <label>ハウス名称</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="例: 1号ハウス"
                            required
                        />
                    </div>
                    <div className={styles.field}>
                        <label>面積 (a: アール)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={area}
                            onChange={(e) => setArea(e.target.value)}
                            placeholder="例: 10.0"
                            required
                        />
                    </div>
                    <button type="submit" className={styles.submitBtn} disabled={submitting}>
                        {submitting ? '登録中...' : '＋ ハウスを追加'}
                    </button>
                </form>
            </section>

            <section className={styles.listSection}>
                <h2>登録済みハウス一覧</h2>
                <div className={styles.grid}>
                    {greenhouses.map((gh) => (
                        <div key={gh.id} className={styles.card}>
                            <div className={styles.ghInfo}>
                                <div className={styles.ghName}>{gh.name}</div>
                                <div className={styles.ghArea}>{gh.areaAcre} a</div>
                            </div>
                            <button
                                className={styles.deleteBtn}
                                onClick={() => handleDelete(gh.id)}
                                title="削除"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}

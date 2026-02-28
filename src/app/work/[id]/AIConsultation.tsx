
'use client'

import { useState, useRef } from 'react'
import styles from './work-detail.module.css'

interface DiagnosisResult {
    label: string
    score: number
    comment: string
    diagnosisId: string | null
    imageUrl: string | null
}

const FEEDBACK_LABELS = [
    { value: '発蕾は確認しやすい状態です', emoji: '✅', colorClass: 'good' },
    { value: '発蕾はやや遅れ気味の可能性があります', emoji: '⚠️', colorClass: 'warn' },
    { value: '発蕾遅れの可能性があります', emoji: '🔴', colorClass: 'danger' },
    { value: '画像だけでは判定が安定しません', emoji: '❓', colorClass: 'unknown' },
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export default function AIConsultation({ workName }: { workName: string }) {
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const [result, setResult] = useState<DiagnosisResult | null>(null)
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    // フィードバック
    const [feedbackSent, setFeedbackSent] = useState(false)
    const [feedbackLoading, setFeedbackLoading] = useState(false)
    const [selectedFeedback, setSelectedFeedback] = useState<string | null>(null)
    const [feedbackNote, setFeedbackNote] = useState('')
    const [feedbackError, setFeedbackError] = useState<string | null>(null)

    const fileInputRef = useRef<HTMLInputElement>(null)

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        setError(null)
        setResult(null)
        setFeedbackSent(false)
        setSelectedFeedback(null)
        setFeedbackNote('')

        if (!file) return

        const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif']
        if (!allowed.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|heic|heif)$/i)) {
            setError('対応していない画像形式です。jpg / jpeg / png を選択してください。')
            return
        }
        if (file.size > MAX_FILE_SIZE) {
            setError('ファイルサイズが大きすぎます（10MB 以下）。')
            return
        }

        if (previewUrl) URL.revokeObjectURL(previewUrl)
        setImageFile(file)
        setPreviewUrl(URL.createObjectURL(file))
    }

    function handleClear() {
        setImageFile(null)
        if (previewUrl) URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
        setResult(null)
        setError(null)
        setFeedbackSent(false)
        setSelectedFeedback(null)
        setFeedbackNote('')
        setFeedbackError(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError(null)

        if (!imageFile) {
            setError('画像を選択してから「診断を実行」してください。')
            return
        }

        setLoading(true)
        setResult(null)
        setFeedbackSent(false)
        setSelectedFeedback(null)

        try {
            const formData = new FormData()
            formData.append('image', imageFile)
            formData.append('workName', workName)

            const res = await fetch('/api/ai/budding-check', {
                method: 'POST',
                body: formData,
            })

            const json = await res.json()

            if (!res.ok) {
                setError(json.error || '診断中にエラーが発生しました。')
                return
            }

            setResult(json as DiagnosisResult)
        } catch {
            setError('通信エラーが発生しました。ネットワークを確認してください。')
        } finally {
            setLoading(false)
        }
    }

    async function handleFeedback() {
        if (!result?.diagnosisId || !selectedFeedback) return

        setFeedbackLoading(true)
        setFeedbackError(null)

        try {
            const res = await fetch('/api/ai/budding-feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    diagnosisId: result.diagnosisId,
                    expertLabel: selectedFeedback,
                    expertNote: feedbackNote,
                }),
            })

            const json = await res.json()

            if (!res.ok) {
                setFeedbackError(json.error || 'フィードバックの送信に失敗しました。')
                return
            }

            setFeedbackSent(true)
        } catch {
            setFeedbackError('通信エラーが発生しました。')
        } finally {
            setFeedbackLoading(false)
        }
    }

    function getLabelClass(label: string): string {
        if (label.includes('確認しやすい')) return styles.labelGood
        if (label.includes('やや遅れ')) return styles.labelWarn
        if (label.includes('遅れの可能性')) return styles.labelDanger
        return styles.labelUnknown
    }

    if (!isOpen) {
        return (
            <button onClick={() => setIsOpen(true)} className={styles.aiButton}>
                🌱 AI発蕾診断 (Beta)
            </button>
        )
    }

    return (
        <div className={styles.aiContainer}>
            <form onSubmit={handleSubmit} className={styles.aiForm}>
                {/* ─── 画像アップロード（スマホではカメラ直撮り対応） ─── */}
                <div className={styles.uploadArea}>
                    <label className={styles.uploadLabel} htmlFor="buddingImage">
                        <span className={styles.uploadIcon}>📷</span>
                        <span className={styles.uploadText}>
                            {imageFile ? imageFile.name : '写真を選択またはカメラで撮影'}
                        </span>
                        <input
                            id="buddingImage"
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/heic,image/heif,.jpg,.jpeg,.png,.heic,.heif"
                            capture="environment"   // スマホでリアカメラを優先起動
                            onChange={handleFileChange}
                            className={styles.fileInput}
                        />
                    </label>
                </div>

                {/* ─── 画像プレビュー ─── */}
                {previewUrl && (
                    <div className={styles.previewContainer}>
                        <img
                            src={previewUrl}
                            alt="選択した画像のプレビュー"
                            className={styles.previewImage}
                        />
                    </div>
                )}

                {/* ─── エラー ─── */}
                {error && (
                    <div className={styles.diagnosisError} role="alert">
                        ⚠️ {error}
                    </div>
                )}

                {/* ─── アクションボタン ─── */}
                <div className={styles.formActions}>
                    <button
                        type="submit"
                        disabled={loading}
                        className={styles.submitButton}
                    >
                        {loading
                            ? <span className={styles.loadingSpinner}>診断中...</span>
                            : '診断を実行'}
                    </button>
                    <button
                        type="button"
                        onClick={handleClear}
                        className={styles.cancelButton}
                        disabled={loading}
                    >
                        クリア
                    </button>
                    <button
                        type="button"
                        onClick={() => { handleClear(); setIsOpen(false) }}
                        className={styles.cancelButton}
                        disabled={loading}
                    >
                        閉じる
                    </button>
                </div>
            </form>

            {/* ─── 診断結果 ─── */}
            {result && (
                <div className={styles.diagnosisResult}>
                    {/* ラベル（大きく表示） */}
                    <div className={`${styles.diagnosisLabel} ${getLabelClass(result.label)}`}>
                        {result.label}
                    </div>

                    {/* 補足コメント */}
                    <p className={styles.diagnosisComment}>{result.comment}</p>

                    {/* 参考スコア */}
                    <div className={styles.scoreRow}>
                        <span className={styles.scoreLabel}>参考スコア</span>
                        <div className={styles.scoreBar}>
                            <div
                                className={styles.scoreBarFill}
                                style={{ width: `${Math.round(result.score * 100)}%` }}
                            />
                        </div>
                        <span className={styles.scoreValue}>{Math.round(result.score * 100)}%</span>
                    </div>
                    <p className={styles.scoreNote}>
                        ※ スコアは仮実装の参考値です。
                    </p>

                    {/* ─── 熟練者フィードバック ─── */}
                    {result.diagnosisId && !feedbackSent && (
                        <div className={styles.feedbackSection}>
                            <p className={styles.feedbackTitle}>
                                👨‍🌾 熟練者フィードバック（任意）
                            </p>
                            <p className={styles.feedbackSubtitle}>
                                実際の発蕾状態として正しい判定を選んでください。データ改善に使用されます。
                            </p>
                            <div className={styles.feedbackButtons}>
                                {FEEDBACK_LABELS.map((item) => (
                                    <button
                                        key={item.value}
                                        type="button"
                                        onClick={() => setSelectedFeedback(item.value)}
                                        className={`${styles.feedbackBtn} ${selectedFeedback === item.value ? styles.feedbackBtnSelected : ''}`}
                                    >
                                        {item.emoji} {item.value}
                                    </button>
                                ))}
                            </div>

                            {selectedFeedback && (
                                <>
                                    <textarea
                                        className={styles.feedbackNote}
                                        placeholder="補足メモ（任意）例：草丈30cm、定植後25日目"
                                        value={feedbackNote}
                                        onChange={(e) => setFeedbackNote(e.target.value)}
                                        rows={2}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleFeedback}
                                        disabled={feedbackLoading}
                                        className={styles.feedbackSubmitBtn}
                                    >
                                        {feedbackLoading
                                            ? <span className={styles.loadingSpinner}>送信中...</span>
                                            : '✓ フィードバックを送信'}
                                    </button>

                                    {feedbackError && (
                                        <div className={styles.diagnosisError}>{feedbackError}</div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* フィードバック完了 */}
                    {feedbackSent && (
                        <div className={styles.feedbackDone}>
                            ✅ フィードバックを受け取りました。ありがとうございます！
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

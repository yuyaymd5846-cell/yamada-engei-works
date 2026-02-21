'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import styles from './QuickRecordForm.module.css'

interface QuickRecordFormProps {
    workName: string
    suggestedGreenhouses: { id: string, name: string, areaAcre: number, lastBatchNumber: number | null }[]
    defaultTime10a: number
}

export default function QuickRecordForm({ workName, suggestedGreenhouses, defaultTime10a }: QuickRecordFormProps) {
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')

    // Form State
    const [selectedGreenhouseIds, setSelectedGreenhouseIds] = useState<string[]>([])
    const [timeHours, setTimeHours] = useState('')
    const [batchNumber, setBatchNumber] = useState('')

    // Photo State
    const [photoFile, setPhotoFile] = useState<File | null>(null)
    const [photoPreview, setPhotoPreview] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Initialize/Update defaults when suggestions change or form opens
    useEffect(() => {
        if (suggestedGreenhouses.length > 0 && selectedGreenhouseIds.length === 0) {
            setSelectedGreenhouseIds(suggestedGreenhouses.map(g => g.id))
        }
    }, [suggestedGreenhouses, isOpen])

    // Update estimated time AND batch number when selection changes
    useEffect(() => {
        if (selectedGreenhouseIds.length > 0) {
            const firstGH = suggestedGreenhouses.find(g => g.id === selectedGreenhouseIds[0])
            if (firstGH && firstGH.lastBatchNumber !== null && !batchNumber) {
                setBatchNumber(firstGH.lastBatchNumber.toString())
            }
            if (defaultTime10a > 0) {
                let totalArea = 0
                selectedGreenhouseIds.forEach(id => {
                    const gh = suggestedGreenhouses.find(g => g.id === id)
                    if (gh) totalArea += gh.areaAcre
                })
                const estimatedHours = (totalArea / 10) * defaultTime10a
                setTimeHours(estimatedHours.toFixed(2))
            }
        } else {
            setTimeHours('')
        }
    }, [selectedGreenhouseIds, defaultTime10a, suggestedGreenhouses])

    const toggleSelection = (id: string) => {
        setSelectedGreenhouseIds(prev =>
            prev.includes(id)
                ? prev.filter(p => p !== id)
                : [...prev, id]
        )
    }

    const toggleSelectAll = () => {
        if (selectedGreenhouseIds.length === suggestedGreenhouses.length) {
            setSelectedGreenhouseIds([])
        } else {
            setSelectedGreenhouseIds(suggestedGreenhouses.map(g => g.id))
        }
    }

    const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Compress the image before setting
        const compressed = await compressImage(file)
        setPhotoFile(compressed)

        // Create preview from compressed file
        const reader = new FileReader()
        reader.onload = (ev) => {
            setPhotoPreview(ev.target?.result as string)
        }
        reader.readAsDataURL(compressed)
    }

    const compressImage = (file: File): Promise<File> => {
        return new Promise((resolve) => {
            const MAX_SIZE = 1200 // max width/height in px
            const QUALITY = 0.7  // JPEG quality (0-1)

            const img = new Image()
            const url = URL.createObjectURL(file)
            img.onload = () => {
                URL.revokeObjectURL(url)

                let { width, height } = img
                // Scale down if larger than MAX_SIZE
                if (width > MAX_SIZE || height > MAX_SIZE) {
                    if (width > height) {
                        height = Math.round((height * MAX_SIZE) / width)
                        width = MAX_SIZE
                    } else {
                        width = Math.round((width * MAX_SIZE) / height)
                        height = MAX_SIZE
                    }
                }

                const canvas = document.createElement('canvas')
                canvas.width = width
                canvas.height = height
                const ctx = canvas.getContext('2d')!
                ctx.drawImage(img, 0, 0, width, height)

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            const compressed = new File([blob], file.name.replace(/\.\w+$/, '.jpg'), {
                                type: 'image/jpeg',
                                lastModified: Date.now()
                            })
                            resolve(compressed)
                        } else {
                            resolve(file) // fallback to original
                        }
                    },
                    'image/jpeg',
                    QUALITY
                )
            }
            img.onerror = () => resolve(file) // fallback
            img.src = url
        })
    }

    const removePhoto = () => {
        setPhotoFile(null)
        setPhotoPreview(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const uploadPhoto = async (): Promise<string | null> => {
        if (!photoFile) return null
        setUploading(true)
        try {
            // Debug file size
            const sizeMB = (photoFile.size / 1024 / 1024).toFixed(2)
            console.log(`Uploading photo: ${photoFile.name}, ${sizeMB}MB, ${photoFile.type}`)

            if (photoFile.size > 4 * 1024 * 1024) {
                alert(`写真が大きすぎます (${sizeMB}MB)。4MB以下にしてください。`)
                return null
            }

            const formData = new FormData()
            formData.append('file', photoFile)
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            })
            if (!res.ok) {
                let errMsg = `HTTP ${res.status}`
                try {
                    const errData = await res.json()
                    errMsg = errData.error || errMsg
                } catch { }
                alert(`アップロード失敗: ${errMsg}`)
                return null
            }
            const data = await res.json()
            return data.url
        } catch (err: any) {
            console.error('Photo upload error:', err)
            alert(`アップロードエラー: ${err.message}\n\nファイルサイズ: ${(photoFile.size / 1024 / 1024).toFixed(2)}MB`)
            return null
        } finally {
            setUploading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsSubmitting(true)

        try {
            if (selectedGreenhouseIds.length === 0) {
                throw new Error('ハウスが選択されていません')
            }

            // Upload photo first if present
            const photoUrl = await uploadPhoto()
            console.log('Photo upload result:', { hasPhotoFile: !!photoFile, photoUrl })

            let totalSelectedArea = 0
            selectedGreenhouseIds.forEach(id => {
                const gh = suggestedGreenhouses.find(g => g.id === id)
                if (gh) totalSelectedArea += gh.areaAcre
            })

            const totalHours = parseFloat(timeHours) || 0

            const payload = selectedGreenhouseIds.map(id => {
                const gh = suggestedGreenhouses.find(g => g.id === id)!
                const ratio = totalSelectedArea > 0 ? gh.areaAcre / totalSelectedArea : 1 / selectedGreenhouseIds.length
                const hoursForHouse = parseFloat((totalHours * ratio).toFixed(2))

                return {
                    workName,
                    greenhouseName: gh.name,
                    batchNumber: batchNumber ? parseInt(batchNumber) : null,
                    spentTime: hoursForHouse,
                    areaAcre: gh.areaAcre,
                    photoUrl: photoUrl,
                    date: new Date().toISOString()
                }
            })

            // Debug: show what we're sending
            if (photoFile) {
                alert(`写真デバッグ: photoUrl=${photoUrl || '(なし)'}\npayload photoUrl=${payload[0]?.photoUrl || '(なし)'}`)
            }

            const res = await fetch('/api/record', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            if (!res.ok) {
                throw new Error('保存に失敗しました')
            }

            // Success
            setIsOpen(false)
            setTimeHours('')
            setBatchNumber('')
            removePhoto()
            router.refresh()

        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className={styles.triggerButton}
            >
                📝 記録する
            </button>
        )
    }

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            {error && <p className={styles.error}>{error}</p>}

            <div className={styles.row}>
                <div className={styles.group} style={{ flex: 2 }}>
                    <div className={styles.labelRow}>
                        <label>ハウス ({selectedGreenhouseIds.length})</label>
                        <button type="button" onClick={toggleSelectAll} className={styles.selectAllBtn}>
                            {selectedGreenhouseIds.length === suggestedGreenhouses.length ? '全解除' : '全選択'}
                        </button>
                    </div>
                    <div className={styles.badgeGrid}>
                        {suggestedGreenhouses.map(g => (
                            <button
                                key={g.id}
                                type="button"
                                className={`${styles.badge} ${selectedGreenhouseIds.includes(g.id) ? styles.selected : ''}`}
                                onClick={() => toggleSelection(g.id)}
                            >
                                {g.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={styles.group} style={{ flex: 1 }}>
                    <label>何作目</label>
                    <input
                        type="number"
                        min="1"
                        value={batchNumber}
                        onChange={(e) => setBatchNumber(e.target.value)}
                        placeholder="例: 1"
                        className={styles.input}
                    />
                </div>
            </div>

            <div className={styles.row}>
                <div className={styles.group} style={{ flex: 1 }}>
                    <label>合計時間 (時間)</label>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={timeHours}
                        onChange={(e) => setTimeHours(e.target.value)}
                        placeholder="例: 1.5"
                        className={styles.input}
                    />
                </div>

                {/* Photo section */}
                <div className={styles.group} style={{ flex: 1 }}>
                    <label>📷 写真</label>
                    {photoPreview ? (
                        <div className={styles.photoPreviewWrap}>
                            <img src={photoPreview} alt="プレビュー" className={styles.photoPreview} />
                            <button type="button" onClick={removePhoto} className={styles.photoRemove}>✕</button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className={styles.photoBtn}
                        >
                            📸 撮影/選択
                        </button>
                    )}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handlePhotoSelect}
                        style={{ display: 'none' }}
                    />
                </div>
            </div>

            <div className={styles.actions}>
                <button
                    type="button"
                    onClick={() => { setIsOpen(false); removePhoto() }}
                    className={styles.cancelButton}
                    disabled={isSubmitting}
                >
                    ✕
                </button>
                <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={isSubmitting || uploading}
                >
                    {uploading ? '📷 アップロード中...' : isSubmitting ? '保存中...' : `一括保存 (${selectedGreenhouseIds.length})`}
                </button>
            </div>
        </form>
    )
}


'use client'

import { useState, useRef } from 'react'
import styles from './image-upload.module.css'

interface ImageUploadProps {
    onUploadSuccess: (url: string) => void
}

export default function ImageUpload({ onUploadSuccess }: ImageUploadProps) {
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        const formData = new FormData()
        formData.append('file', file)

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            })

            if (!res.ok) throw new Error('アップロード失敗')

            const data = await res.json()
            onUploadSuccess(data.url)
        } catch (err) {
            alert('エラー: 写真のアップロードに失敗しました。')
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    return (
        <div className={styles.uploadContainer}>
            <button
                type="button"
                className={styles.uploadButton}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
            >
                {uploading ? '送信中...' : '📷 写真を撮影・選択'}
            </button>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                capture="environment" // Forces back camera on mobile
                className={styles.hiddenInput}
            />
        </div>
    )
}

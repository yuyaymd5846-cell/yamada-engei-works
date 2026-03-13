'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import styles from './VoiceRecordButton.module.css'

interface ParsedRecord {
  workName: string
  greenhouseName: string | null
  spentTime: number
  note: string
  suggestedBatchNumber: string | null
}

type SpeechRecognitionEvent = Event & {
  results: SpeechRecognitionResultList
}

type SpeechRecognitionErrorEvent = Event & {
  error: string
}

export default function VoiceRecordButton() {
  const router = useRouter()
  const recognitionRef = useRef<any>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [parsedData, setParsedData] = useState<ParsedRecord | null>(null)
  const [error, setError] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [transcript, setTranscript] = useState('')

  const startRecording = () => {
    try {
      // Web Speech API を初期化
      const SpeechRecognition = window.webkitSpeechRecognition || (window as any).SpeechRecognition
      if (!SpeechRecognition) {
        setError('このブラウザは音声認識に対応していません')
        return
      }

      const recognition = new SpeechRecognition()
      recognition.lang = 'ja-JP'
      recognition.interimResults = false
      recognition.continuous = false

      recognition.onstart = () => {
        setIsRecording(true)
        setError('')
        setTranscript('')
      }

      recognition.onresult = async (event: SpeechRecognitionEvent) => {
        let finalTranscript = ''
        for (let i = 0; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          finalTranscript += transcript
        }
        setTranscript(finalTranscript)
        await sendTranscriptToAPI(finalTranscript)
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        setError(`音声認識エラー: ${event.error}`)
        setIsRecording(false)
      }

      recognition.onend = () => {
        setIsRecording(false)
      }

      recognition.start()
      recognitionRef.current = recognition
    } catch (err) {
      setError('音声認識の開始に失敗しました')
      console.error('Recording error:', err)
    }
  }

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsRecording(false)
    }
  }

  const sendTranscriptToAPI = async (text: string) => {
    setIsParsing(true)
    setError('')

    try {
      const response = await fetch('/api/ai/voice-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: text
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '音声の解析に失敗しました')
      }

      const result = await response.json()
      setParsedData(result.data)
      setIsParsing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : '音声の解析に失敗しました')
      setIsParsing(false)
    }
  }

  const handleSaveRecord = async () => {
    if (!parsedData) return

    try {
      const recordData = {
        workName: parsedData.workName,
        greenhouseName: parsedData.greenhouseName || '不明',
        batchNumber: parsedData.suggestedBatchNumber ? parseInt(parsedData.suggestedBatchNumber) : null,
        spentTime: parsedData.spentTime,
        note: parsedData.note,
        date: new Date().toISOString()
      }

      const res = await fetch('/api/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recordData)
      })

      if (!res.ok) {
        throw new Error('保存に失敗しました')
      }

      // リセット
      setParsedData(null)
      setIsOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました')
    }
  }

  const handleCancel = () => {
    setParsedData(null)
    setError('')
  }

  // 解析結果表示ビュー
  if (parsedData) {
    return (
      <div className={styles.resultContainer}>
        <h4 className={styles.resultTitle}>解析結果</h4>
        <div className={styles.resultFields}>
          <div className={styles.field}>
            <label>作業:</label>
            <span>{parsedData.workName}</span>
          </div>
          <div className={styles.field}>
            <label>ハウス:</label>
            <span>{parsedData.greenhouseName || '未指定'}</span>
          </div>
          <div className={styles.field}>
            <label>時間:</label>
            <span>{parsedData.spentTime}時間</span>
          </div>
          {parsedData.note && (
            <div className={styles.field}>
              <label>備考:</label>
              <span>{parsedData.note}</span>
            </div>
          )}
        </div>
        <div className={styles.actions}>
          <button onClick={handleCancel} className={styles.cancelBtn}>
            キャンセル
          </button>
          <button onClick={handleSaveRecord} className={styles.saveBtn}>
            ✓ 保存する
          </button>
        </div>
      </div>
    )
  }

  // 通常ビュー
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={styles.voiceButton}
        title="音声で作業記録を入力"
      >
        🎤
      </button>
    )
  }

  return (
    <div className={styles.voiceContainer}>
      <div className={styles.header}>
        <h3>音声で作業記録を入力</h3>
        <button
          onClick={() => {
            setIsOpen(false)
            setError('')
            if (isRecording) stopRecording()
          }}
          className={styles.closeBtn}
        >
          ✕
        </button>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.recordingContainer}>
        {isRecording ? (
          <div className={styles.recordingActive}>
            <div className={styles.recordingDot} />
            <span>録音中...</span>
          </div>
        ) : isParsing ? (
          <div className={styles.parsingActive}>
            <span>⟳ 解析中...</span>
          </div>
        ) : (
          <p className={styles.instructionText}>
            例：「ハウスA-1で30分間かん水した」や「栽培管理を1時間やった」のように話してください
          </p>
        )}
      </div>

      <div className={styles.buttonGroup}>
        {!isRecording && !isParsing && (
          <button onClick={startRecording} className={styles.recordBtn}>
            🎤 録音開始
          </button>
        )}
        {isRecording && (
          <button onClick={stopRecording} className={styles.stopBtn}>
            ⏹ 停止
          </button>
        )}
      </div>
    </div>
  )
}

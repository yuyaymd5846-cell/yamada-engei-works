
'use client'

import { useState, useEffect } from 'react'
import styles from './records.module.css'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

interface WorkRecord {
    id: string
    workName: string
    greenhouseName: string
    batchNumber: number
    areaAcre: number
    spentTime: number
    note: string
    date: string
}

export default function WorkRecordsPage() {
    const [records, setRecords] = useState<WorkRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editValues, setEditValues] = useState<Partial<WorkRecord>>({})
    const [importing, setImporting] = useState(false)

    const fetchRecords = async () => {
        try {
            const res = await fetch('/api/record')
            const data = await res.json()
            setRecords(data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRecords()
    }, [])


    const processImportItems = async (rawData: any[]) => {
        if (!rawData || rawData.length === 0) {
            alert('データが見つかりませんでした。')
            setImporting(false)
            return
        }

        // Logic to find header row if rawData is array of arrays (from XLSX header:1)
        let processedData = rawData
        let headerRowIndex = -1

        if (Array.isArray(rawData[0])) {
            // Find row containing "日にち" or "ほ場名"
            headerRowIndex = rawData.findIndex(row =>
                row && row.some((cell: any) => typeof cell === 'string' && (cell.includes('日にち') || cell.includes('ほ場名')))
            )

            if (headerRowIndex !== -1) {
                const headers = rawData[headerRowIndex].map((h: any) => String(h || '').trim())
                processedData = rawData.slice(headerRowIndex + 1).map(row => {
                    const obj: any = {}
                    headers.forEach((h: string, i: number) => {
                        if (h) obj[h] = row[i]
                    })
                    return obj
                })
            }
        }

        // Map Excel headers to our API fields with robust key matching
        const findValue = (row: any, keys: string[]) => {
            const rowKeys = Object.keys(row)
            // Prefer exact matches first to avoid "作" matching "作業名"
            let matchedKey = rowKeys.find(rk => keys.some(k => rk.trim() === k))
            if (!matchedKey) {
                // Partial match fallback, but exclude "作業" if we are looking for short keys like "作"
                matchedKey = rowKeys.find(rk => keys.some(k => {
                    const trimmed = rk.trim()
                    if (k === '作' && trimmed.includes('作業')) return false
                    return trimmed.includes(k)
                }))
            }
            return matchedKey ? row[matchedKey] : undefined
        }

        const mappedRecords = processedData.map(row => {
            const dateVal = findValue(row, ['日にち', '日付'])
            const ghVal = findValue(row, ['ほ場名', 'ハウス', '場所'])
            const workVal = findValue(row, ['作業名', '作業内容'])
            const batchVal = findValue(row, ['作目', '作', '回数', 'バッチ'])
            const timeVal = findValue(row, ['作業時間', '時間'])
            const noteVal = findValue(row, ['備考', 'メモ'])

            return {
                date: dateVal,
                greenhouseName: String(ghVal || '').trim(),
                workName: String(workVal || '').trim(),
                batchNumber: batchVal,
                spentTime: timeVal,
                note: noteVal
            }
        }).filter(r => r.workName && r.greenhouseName && r.workName !== '作業名')

        if (mappedRecords.length === 0) {
            alert('有効なデータが見つかりませんでした。ヘッダー（日にち, ほ場名, 作業名...）が正しく含まれているか確認してください。')
            setImporting(false)
            return
        }

        try {
            const res = await fetch('/api/record', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(mappedRecords)
            })
            if (res.ok) {
                alert(`${mappedRecords.length}件のデータをインポートしました`)
                fetchRecords()
            } else {
                const errData = await res.json()
                alert(`インポートに失敗しました: ${errData.error || '不明なエラー'}`)
            }
        } catch (err) {
            alert('通信エラーが発生しました')
        } finally {
            setImporting(false)
        }
    }

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setImporting(true)

        if (file.name.endsWith('.csv')) {
            Papa.parse(file, {
                header: false, // Read as array of arrays to use same logic
                skipEmptyLines: true,
                complete: (results) => {
                    processImportItems(results.data)
                    e.target.value = ''
                },
                error: (error) => {
                    alert('CSVファイルの読み取りに失敗しました')
                    setImporting(false)
                }
            })
        } else {
            // Excel (.xlsx, .xls)
            const reader = new FileReader()
            reader.onload = (evt) => {
                try {
                    const bstr = evt.target?.result
                    const wb = XLSX.read(bstr, { type: 'binary', cellDates: true })
                    // Try to find "作業一覧" or a sheet with "作業" in name, fallback to first sheet
                    const wsname = wb.SheetNames.find(n => n.includes('作業')) || wb.SheetNames[0]
                    const ws = wb.Sheets[wsname]
                    // Read as array of arrays (header: 1) to find the actual header row
                    const data = XLSX.utils.sheet_to_json(ws, { header: 1 })
                    processImportItems(data)
                } catch (err) {
                    console.error(err)
                    alert('Excelファイルの解析に失敗しました')
                    setImporting(false)
                }
                e.target.value = ''
            }
            reader.onerror = () => {
                alert('ファイルの読み込みに失敗しました')
                setImporting(false)
            }
            reader.readAsBinaryString(file)
        }
    }

    const handleEdit = (record: WorkRecord) => {
        setEditingId(record.id)
        setEditValues({
            date: new Date(record.date).toISOString().split('T')[0],
            batchNumber: record.batchNumber,
            spentTime: record.spentTime, // Displayed as-is (hr)
            note: record.note
        })
    }

    const handleSave = async (id: string) => {
        try {
            // No conversion needed, raw value is in hours
            const payload = { ...editValues }

            const res = await fetch('/api/record', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ...payload })
            })

            if (res.ok) {
                setEditingId(null)
                fetchRecords()
            } else {
                alert('更新に失敗しました')
            }
        } catch (err) {
            alert('エラーが発生しました')
        }
    }

    const exportToCSV = () => {
        if (records.length === 0) return
        const headers = ['日付', '作業名', 'ハウス', '作目', '面積', '時間', '備考']
        const csvRows = [
            headers.join(','),
            ...records.map(r => [
                new Date(r.date).toLocaleDateString('ja-JP'),
                r.workName,
                r.greenhouseName,
                r.batchNumber || '',
                r.areaAcre,
                r.spentTime, // hr
                `"${r.note?.replace(/"/g, '""') || ''}"`
            ].join(','))
        ]
        const csvContent = '\uFEFF' + csvRows.join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '')
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `yamada_work_records_${dateStr}.csv`)
        link.click()
    }

    const downloadDB = () => {
        const link = document.createElement('a')
        link.href = '/api/backup'
        link.click()
    }

    const deleteRecord = async (id: string) => {
        if (!confirm('このレコードを削除しますか？')) return
        try {
            const res = await fetch(`/api/record?id=${id}`, { method: 'DELETE' })
            if (res.ok) {
                fetchRecords()
            } else {
                alert('削除に失敗しました')
            }
        } catch (err) {
            alert('エラーが発生しました')
        }
    }

    const clearAllRecords = async () => {
        if (!confirm('本当に全ての作業実績を消去しますか？この操作は元に戻せません。')) return
        try {
            const res = await fetch('/api/record?all=true', { method: 'DELETE' })
            if (res.ok) {
                alert('全てのレコードを消去しました')
                fetchRecords()
            } else {
                alert('消去に失敗しました')
            }
        } catch (err) {
            alert('エラーが発生しました')
        }
    }

    if (loading) return <div className={styles.container}>読み込み中...</div>

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>作業実績一覧</h1>
                <div className={styles.headerActions}>
                    <label className={styles.importBtn}>
                        {importing ? '⌛ 取り込み中...' : '📥 Excelデータをインポート'}
                        <input
                            type="file"
                            accept=".csv, .xlsx, .xls"
                            onChange={handleImport}
                            style={{ display: 'none' }}
                            disabled={importing}
                        />
                    </label>
                    <button onClick={exportToCSV} className={styles.exportBtn} disabled={records.length === 0}>
                        📤 CSV出力
                    </button>
                    <button onClick={downloadDB} className={styles.dbBtn}>
                        💾 DBバックアップ
                    </button>
                    <button onClick={clearAllRecords} className={styles.clearBtn}>
                        🗑️ 全消去
                    </button>
                </div>
            </header>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th style={{ width: '120px' }}>日付</th>
                            <th>作業名</th>
                            <th>圃場名</th>
                            <th style={{ width: '80px' }}>作目</th>
                            <th style={{ width: '80px' }}>時間</th>
                            <th>備考</th>
                            <th style={{ width: '80px' }}>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {records.map(record => {
                            const isEditing = editingId === record.id
                            return (
                                <tr key={record.id}>
                                    <td>
                                        {isEditing ? (
                                            <input
                                                type="date"
                                                value={editValues.date}
                                                onChange={e => setEditValues({ ...editValues, date: e.target.value })}
                                                className={styles.inlineInput}
                                            />
                                        ) : (
                                            new Date(record.date).toLocaleDateString('ja-JP')
                                        )}
                                    </td>
                                    <td>{record.workName}</td>
                                    <td>{record.greenhouseName}</td>
                                    <td>
                                        {isEditing ? (
                                            <input
                                                type="number"
                                                value={editValues.batchNumber}
                                                onChange={e => setEditValues({ ...editValues, batchNumber: Number(e.target.value) })}
                                                className={styles.inlineInput}
                                            />
                                        ) : (
                                            record.batchNumber
                                        )}
                                    </td>
                                    <td className={styles.weight700}>
                                        {isEditing ? (
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={editValues.spentTime} // This is now in hours
                                                onChange={e => setEditValues({ ...editValues, spentTime: Number(e.target.value) })}
                                                className={styles.inlineInput}
                                            />
                                        ) : (
                                            record.spentTime
                                        )}
                                    </td>
                                    <td className={styles.noteCell}>
                                        {isEditing ? (
                                            <textarea
                                                value={editValues.note}
                                                onChange={e => setEditValues({ ...editValues, note: e.target.value })}
                                                className={styles.inlineTextarea}
                                            />
                                        ) : (
                                            record.note
                                        )}
                                    </td>
                                    <td>
                                        {isEditing ? (
                                            <button onClick={() => handleSave(record.id)} className={styles.saveInlineBtn}>保存</button>
                                        ) : (
                                            <div className={styles.rowActions}>
                                                <button onClick={() => handleEdit(record)} className={styles.editBtn}>編集</button>
                                                <button onClick={() => deleteRecord(record.id)} className={styles.deleteBtn}>削除</button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                        {records.length === 0 && (
                            <tr>
                                <td colSpan={7} className={styles.empty}>実績がまだありません。</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}


'use client'

import { useEffect, useMemo, useState } from 'react'
import styles from './records.module.css'

interface WorkRecord {
    id: string
    workName: string
    greenhouseName: string
    batchNumber: number
    areaAcre: number
    spentTime: number
    note: string
    workerName: string | null
    photoUrl: string | null
    date: string
}

type SortKey = 'date' | 'workName' | 'greenhouseName' | 'spentTime'
type SortDir = 'asc' | 'desc'

function normalizeWorkerName(workerName: string | null) {
    if (!workerName) return '-'
    const stripped = workerName
        .replace(/^[\p{Extended_Pictographic}\uFE0F\u200D\s]+/u, '')
        .trim()
    return stripped || workerName.trim() || '-'
}

export default function WorkRecordsPage() {
    const [records, setRecords] = useState<WorkRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editValues, setEditValues] = useState<Partial<WorkRecord>>({})
    const [importing, setImporting] = useState(false)
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

    // Filter state
    const [filterMonth, setFilterMonth] = useState(() => {
        const now = new Date()
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    })
    const [filterGH, setFilterGH] = useState('all')
    const [filterWork, setFilterWork] = useState('all')

    const handleFilterGH = (v: string) => { setFilterGH(v); setCurrentPage(1) }
    const handleFilterWork = (v: string) => { setFilterWork(v); setCurrentPage(1) }

    // Sort state
    const [sortKey, setSortKey] = useState<SortKey>('date')
    const [sortDir, setSortDir] = useState<SortDir>('desc')

    // Pagination state
    const ITEMS_PER_PAGE = 50
    const [currentPage, setCurrentPage] = useState(1)

    const fetchRecords = async (month: string) => {
        try {
            const res = await fetch(`/api/record?month=${encodeURIComponent(month)}`)
            const data = await res.json()
            setRecords(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRecords(filterMonth)
    }, [filterMonth])

    // Unique values for dropdowns
    const uniqueGreenhouses = useMemo(() =>
        [...new Set(records.map(r => r.greenhouseName))].sort()
        , [records])

    const uniqueWorkNames = useMemo(() =>
        [...new Set(records.map(r => r.workName))].sort()
        , [records])

    // Month navigation
    const navigateMonth = (delta: number) => {
        const [y, m] = filterMonth.split('-').map(Number)
        const d = new Date(y, m - 1 + delta, 1)
        setFilterMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
        setCurrentPage(1)
    }

    const monthLabel = useMemo(() => {
        const [y, m] = filterMonth.split('-').map(Number)
        return `${y}年${m}月`
    }, [filterMonth])

    // Filtered records
    const filteredRecords = useMemo(() => {
        const [y, m] = filterMonth.split('-').map(Number)
        return records.filter(r => {
            const d = new Date(r.date)
            if (d.getFullYear() !== y || d.getMonth() + 1 !== m) return false
            if (filterGH !== 'all' && r.greenhouseName !== filterGH) return false
            if (filterWork !== 'all' && r.workName !== filterWork) return false
            return true
        })
    }, [records, filterMonth, filterGH, filterWork])

    // Sorted records
    const sortedRecords = useMemo(() => {
        const sorted = [...filteredRecords].sort((a, b) => {
            let cmp = 0
            switch (sortKey) {
                case 'date':
                    cmp = new Date(a.date).getTime() - new Date(b.date).getTime()
                    break
                case 'workName':
                    cmp = a.workName.localeCompare(b.workName)
                    break
                case 'greenhouseName':
                    cmp = a.greenhouseName.localeCompare(b.greenhouseName)
                    break
                case 'spentTime':
                    cmp = a.spentTime - b.spentTime
                    break
            }
            return sortDir === 'asc' ? cmp : -cmp
        })
        return sorted
    }, [filteredRecords, sortKey, sortDir])

    // Summary stats
    const summary = useMemo(() => {
        const totalCount = filteredRecords.length
        const totalTime = filteredRecords.reduce((sum, r) => sum + r.spentTime, 0)

        // Work-name breakdown
        const byWork = new Map<string, number>()
        filteredRecords.forEach(r => {
            byWork.set(r.workName, (byWork.get(r.workName) || 0) + r.spentTime)
        })
        const workBreakdown = [...byWork.entries()]
            .sort((a, b) => b[1] - a[1]) // Most time first
        const maxWorkTime = workBreakdown.length > 0 ? workBreakdown[0][1] : 1

        return { totalCount, totalTime, workBreakdown, maxWorkTime }
    }, [filteredRecords])

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
        } else {
            setSortKey(key)
            setSortDir('desc')
        }
        setCurrentPage(1)
    }

    // Pagination derived values
    const totalPages = Math.ceil(sortedRecords.length / ITEMS_PER_PAGE)
    const pagedRecords = sortedRecords.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    )

    const sortIndicator = (key: SortKey) => {
        if (sortKey !== key) return ''
        return sortDir === 'asc' ? ' ▲' : ' ▼'
    }

    // ===== Import/Export/Edit logic (preserved from original) =====
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const processImportItems = async (rawData: any[]) => {
        if (!rawData || rawData.length === 0) {
            alert('データが見つかりませんでした。')
            setImporting(false)
            return
        }
        let processedData = rawData
        let headerRowIndex = -1
        if (Array.isArray(rawData[0])) {
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
        const findValue = (row: any, keys: string[]) => {
            const rowKeys = Object.keys(row)
            let matchedKey = rowKeys.find(rk => keys.some(k => rk.trim() === k))
            if (!matchedKey) {
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
            alert('有効なデータが見つかりませんでした。')
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
                fetchRecords(filterMonth)
            } else {
                const errData = await res.json()
                alert(`インポートに失敗しました: ${errData.error || '不明なエラー'}`)
            }
        } catch {
            alert('通信エラーが発生しました')
        } finally {
            setImporting(false)
        }
    }

    /* eslint-enable @typescript-eslint/no-explicit-any */

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setImporting(true)
        if (file.name.endsWith('.csv')) {
            const Papa = (await import('papaparse')).default
            Papa.parse(file, {
                header: false,
                skipEmptyLines: true,
                complete: (results) => {
                    void processImportItems(results.data)
                    e.target.value = ''
                },
                error: () => {
                    alert('CSVファイルの読み取りに失敗しました')
                    setImporting(false)
                }
            })
        } else {
            const reader = new FileReader()
            reader.onload = async (evt) => {
                try {
                    const XLSX = await import('xlsx')
                    const bstr = evt.target?.result
                    const wb = XLSX.read(bstr, { type: 'binary', cellDates: true })
                    const wsname = wb.SheetNames.find(n => n.includes('作業')) || wb.SheetNames[0]
                    const ws = wb.Sheets[wsname]
                    const data = XLSX.utils.sheet_to_json(ws, { header: 1 })
                    await processImportItems(data)
                } catch (error) {
                    console.error(error)
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
            spentTime: record.spentTime,
            note: record.note
        })
    }

    const handleSave = async (id: string) => {
        try {
            const payload = { ...editValues }
            const res = await fetch('/api/record', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ...payload })
            })
            if (res.ok) {
                setEditingId(null)
                fetchRecords(filterMonth)
            } else {
                alert('更新に失敗しました')
            }
        } catch {
            alert('エラーが発生しました')
        }
    }

    const exportToCSV = () => {
        const target = filteredRecords.length > 0 ? sortedRecords : records
        if (target.length === 0) return
        const headers = ['日付', '作業名', 'ハウス', '作目', '面積', '時間', '記録者', '備考']
        const csvRows = [
            headers.join(','),
            ...target.map(r => [
                new Date(r.date).toLocaleDateString('ja-JP'),
                r.workName,
                r.greenhouseName,
                r.batchNumber || '',
                r.areaAcre,
                r.spentTime,
                `"${r.workerName || ''}"`,
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
            if (res.ok) fetchRecords(filterMonth)
            else alert('削除に失敗しました')
        } catch {
            alert('エラーが発生しました')
        }
    }

    const clearAllRecords = async () => {
        if (!confirm('本当に全ての作業実績を消去しますか？この操作は元に戻せません。')) return
        try {
            const res = await fetch('/api/record?all=true', { method: 'DELETE' })
            if (res.ok) {
                alert('全てのレコードを消去しました')
                fetchRecords(filterMonth)
            } else {
                alert('消去に失敗しました')
            }
        } catch {
            alert('エラーが発生しました')
        }
    }

    if (loading) return <div className={styles.container}>読み込み中...</div>

    // Bar colors for chart
    const barColors = [
        '#4caf50', '#2196f3', '#ff9800', '#e91e63', '#9c27b0',
        '#00bcd4', '#795548', '#607d8b', '#f44336', '#3f51b5',
        '#cddc39', '#ff5722', '#009688', '#673ab7', '#8bc34a'
    ]

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <h1>作業実績</h1>
                <div className={styles.headerActions}>
                    <label className={styles.importBtn}>
                        {importing ? '⌛...' : '📥 インポート'}
                        <input
                            type="file"
                            accept=".csv, .xlsx, .xls"
                            onChange={handleImport}
                            style={{ display: 'none' }}
                            disabled={importing}
                        />
                    </label>
                    <button onClick={exportToCSV} className={styles.exportBtn} disabled={records.length === 0}>
                        📤 CSV
                    </button>
                    <button onClick={downloadDB} className={styles.dbBtn}>💾 DB</button>
                    <button onClick={clearAllRecords} className={styles.clearBtn}>🗑️</button>
                </div>
            </header>

            {/* Filter Bar */}
            <div className={styles.filterBar}>
                <div className={styles.monthNav}>
                    <button onClick={() => navigateMonth(-1)} className={styles.monthBtn}>◀</button>
                    <span className={styles.monthLabel}>{monthLabel}</span>
                    <button onClick={() => navigateMonth(1)} className={styles.monthBtn}>▶</button>
                </div>
                <select
                    value={filterGH}
                    onChange={e => handleFilterGH(e.target.value)}
                    className={styles.filterSelect}
                >
                    <option value="all">全ハウス</option>
                    {uniqueGreenhouses.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <select
                    value={filterWork}
                    onChange={e => handleFilterWork(e.target.value)}
                    className={styles.filterSelect}
                >
                    <option value="all">全作業</option>
                    {uniqueWorkNames.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
            </div>

            {/* Summary Cards */}
            <div className={styles.summaryRow}>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryValue}>{summary.totalCount}</div>
                    <div className={styles.summaryLabel}>件</div>
                </div>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryValue}>{summary.totalTime.toFixed(1)}</div>
                    <div className={styles.summaryLabel}>時間</div>
                </div>
            </div>

            {/* Work Breakdown Chart */}
            {summary.workBreakdown.length > 0 && (
                <div className={styles.chartSection}>
                    <h3 className={styles.chartTitle}>作業別時間</h3>
                    <div className={styles.chartBody}>
                        {summary.workBreakdown.map(([name, time], i) => (
                            <div key={name} className={styles.chartRow}>
                                <span className={styles.chartLabel}>{name}</span>
                                <div className={styles.chartBarTrack}>
                                    <div
                                        className={styles.chartBar}
                                        style={{
                                            width: `${Math.max((time / summary.maxWorkTime) * 100, 2)}%`,
                                            backgroundColor: barColors[i % barColors.length]
                                        }}
                                    />
                                </div>
                                <span className={styles.chartValue}>{time.toFixed(1)}h</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Records Table */}
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th onClick={() => handleSort('date')} className={styles.sortable}>
                                日付{sortIndicator('date')}
                            </th>
                            <th onClick={() => handleSort('workName')} className={styles.sortable}>
                                作業名{sortIndicator('workName')}
                            </th>
                            <th onClick={() => handleSort('greenhouseName')} className={styles.sortable}>
                                圃場{sortIndicator('greenhouseName')}
                            </th>
                            <th>作目</th>
                            <th onClick={() => handleSort('spentTime')} className={styles.sortable}>
                                時間{sortIndicator('spentTime')}
                            </th>
                            <th>記録者</th>
                            <th>備考</th>
                            <th>📷</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pagedRecords.map(record => {
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
                                            new Date(record.date).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })
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
                                                value={editValues.spentTime}
                                                onChange={e => setEditValues({ ...editValues, spentTime: Number(e.target.value) })}
                                                className={styles.inlineInput}
                                            />
                                        ) : (
                                            record.spentTime
                                        )}
                                    </td>
                                    <td>
                                        {normalizeWorkerName(record.workerName)}
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
                                        {record.photoUrl && (
                                            <img
                                                src={record.photoUrl}
                                                alt="写真"
                                                className={styles.thumbnail}
                                                loading="lazy"
                                                decoding="async"
                                                onClick={() => setLightboxUrl(record.photoUrl)}
                                            />
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
                        {sortedRecords.length === 0 && (
                            <tr>
                                <td colSpan={8} className={styles.empty}>
                                    {monthLabel}の実績はありません
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className={styles.pagination}>
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className={styles.pageBtn}
                    >
                        ◀
                    </button>
                    <span className={styles.pageInfo}>
                        {currentPage} / {totalPages} ページ
                        <span className={styles.pageRange}>
                            （{(currentPage - 1) * ITEMS_PER_PAGE + 1}〜{Math.min(currentPage * ITEMS_PER_PAGE, sortedRecords.length)}件 / 全{sortedRecords.length}件）
                        </span>
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className={styles.pageBtn}
                    >
                        ▶
                    </button>
                </div>
            )}

            {/* Mobile card view */}
            <div className={styles.mobileCards}>
                {pagedRecords.map(record => {
                    const isEditing = editingId === record.id
                    return (
                        <div key={record.id} className={`${styles.mobileCard} ${isEditing ? styles.mobileCardEditing : ''}`}>
                            {isEditing ? (
                                <>
                                    <div className={styles.mobileEditGrid}>
                                        <label>日付</label>
                                        <input
                                            type="date"
                                            value={editValues.date}
                                            onChange={e => setEditValues({ ...editValues, date: e.target.value })}
                                            className={styles.inlineInput}
                                        />
                                        <label>作目</label>
                                        <input
                                            type="number"
                                            value={editValues.batchNumber}
                                            onChange={e => setEditValues({ ...editValues, batchNumber: Number(e.target.value) })}
                                            className={styles.inlineInput}
                                        />
                                        <label>時間</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={editValues.spentTime}
                                            onChange={e => setEditValues({ ...editValues, spentTime: Number(e.target.value) })}
                                            className={styles.inlineInput}
                                        />
                                        <label>備考</label>
                                        <textarea
                                            value={editValues.note}
                                            onChange={e => setEditValues({ ...editValues, note: e.target.value })}
                                            className={styles.inlineTextarea}
                                        />
                                    </div>
                                    <div className={styles.mobileCardActions}>
                                        <button onClick={() => setEditingId(null)} className={styles.deleteBtn}>キャンセル</button>
                                        <button onClick={() => handleSave(record.id)} className={styles.saveInlineBtn}>保存</button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className={styles.mobileCardHead}>
                                        <span className={styles.mobileDate}>
                                            {new Date(record.date).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}
                                        </span>
                                        <span className={styles.mobileWork}>{record.workName}</span>
                                        <span className={styles.mobileTime}>{record.spentTime}h</span>
                                    </div>
                                    <div className={styles.mobileCardBody}>
                                        <span>{record.greenhouseName}</span>
                                        {record.batchNumber && <span>第{record.batchNumber}作</span>}
                                        {record.workerName && <span className={styles.mobileWorker}>担当: {normalizeWorkerName(record.workerName)}</span>}
                                        {record.note && <span className={styles.mobileNote}>{record.note}</span>}
                                    </div>
                                    {record.photoUrl && (
                                        <img
                                            src={record.photoUrl}
                                            alt="写真"
                                            className={styles.mobilePhoto}
                                            loading="lazy"
                                            decoding="async"
                                            onClick={() => setLightboxUrl(record.photoUrl)}
                                        />
                                    )}
                                    <div className={styles.mobileCardActions}>
                                        <button onClick={() => handleEdit(record)} className={styles.editBtn}>編集</button>
                                        <button onClick={() => deleteRecord(record.id)} className={styles.deleteBtn}>削除</button>
                                    </div>
                                </>
                            )}
                        </div>
                    )
                })}
                {sortedRecords.length === 0 && (
                    <div className={styles.empty}>{monthLabel}の実績はありません</div>
                )}
            </div>

            {/* Mobile pagination */}
            {totalPages > 1 && (
                <div className={styles.pagination}>
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className={styles.pageBtn}
                    >
                        ◀ 前へ
                    </button>
                    <span className={styles.pageInfo}>{currentPage} / {totalPages}</span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className={styles.pageBtn}
                    >
                        次へ ▶
                    </button>
                </div>
            )}

            {/* Lightbox */}
            {lightboxUrl && (
                <div className={styles.lightbox} onClick={() => setLightboxUrl(null)}>
                    <img src={lightboxUrl} alt="拡大写真" className={styles.lightboxImg} />
                    <button className={styles.lightboxClose} onClick={() => setLightboxUrl(null)}>✕</button>
                </div>
            )}
        </div>
    )
}

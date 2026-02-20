
import prisma from '@/lib/prisma'
import Link from 'next/link'
import styles from './search.module.css'
import { redirect } from 'next/navigation'

// Server Action for search (optional, or just use GET form)
async function searchAction(formData: FormData) {
    'use server'
    const query = formData.get('query')
    const stage = formData.get('stage')
    const sort = formData.get('sort')

    const params = new URLSearchParams()
    if (query) params.set('q', query.toString())
    if (stage) params.set('stage', stage.toString())
    if (sort) params.set('sort', sort.toString())

    redirect(`/search?${params.toString()}`)
}

export default async function SearchPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; stage?: string; sort?: string }>
}) {
    const params = await searchParams
    const q = params.q || ''
    const stage = params.stage || ''
    const sort = params.sort || ''

    // Build prisma query
    const where: any = {}
    if (q) {
        where.workName = { contains: q }
    }
    if (stage) {
        where.stage = { contains: stage }
    }

    let orderBy: any = {}
    if (sort === 'profit') {
        // Ideally numeric, but for now just ID or something distinct
        orderBy = { requiredTime10a: 'asc' } // Placeholder for profit (efficiency)
    } else if (sort === 'risk') {
        orderBy = { difficultyLevel: 'desc' } // Placeholder
    } else {
        orderBy = { updatedAt: 'desc' }
    }

    const works = await prisma.workManual.findMany({
        where,
        orderBy,
    })

    // Get all unique stages for filter dropdown
    const allStages = await prisma.workManual.findMany({
        select: { stage: true },
        distinct: ['stage']
    })

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>作業検索</h1>

            <div className={styles.headerActions}>
                <Link href="/work/new" className={styles.newButton}>
                    ＋ 新規作業を登録
                </Link>
            </div>

            <form action={searchAction} className={styles.searchForm}>
                <div className={styles.formGroup}>
                    <label>作業名</label>
                    <input type="text" name="query" defaultValue={q} placeholder="キーワード..." className={styles.input} />
                </div>

                <div className={styles.formGroup}>
                    <label>ステージ</label>
                    <select name="stage" defaultValue={stage} className={styles.select}>
                        <option value="">全て</option>
                        {allStages.map(s => (
                            <option key={s.stage} value={s.stage}>{s.stage}</option>
                        ))}
                    </select>
                </div>

                <div className={styles.formGroup}>
                    <label>並び替え</label>
                    <select name="sort" defaultValue={sort} className={styles.select}>
                        <option value="">新着順</option>
                        <option value="risk">難易度/リスク順</option>
                        <option value="profit">効率(時間短い順)</option>
                    </select>
                </div>

                <button type="submit" className={styles.button}>検索</button>
            </form>

            <div className={styles.results}>
                {works.length === 0 ? (
                    <p className={styles.noResults}>該当する作業が見つかりませんでした。</p>
                ) : (
                    works.map(work => (
                        <Link href={`/work/${work.id}`} key={work.id} className={styles.card}>
                            <div className={styles.cardInfo}>
                                <h3 className={styles.cardTitle}>{work.workName}</h3>
                                <span className={styles.cardBadge}>{work.stage}</span>
                            </div>
                            <div className={styles.cardMeta}>
                                <span>Risk: {work.riskIfNotDone.substring(0, 20)}...</span>
                                <span>Profit: {work.impactOnProfit.substring(0, 20)}...</span>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    )
}

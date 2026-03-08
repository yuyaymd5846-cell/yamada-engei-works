

import prisma from '@/lib/prisma'
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import styles from './work-detail.module.css'
import AIConsultation from './AIConsultation'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import QuickWorkRecord from './TimeCalculator'

export default async function WorkDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const work = await prisma.workManual.findUnique({
        where: { id },
    })

    if (!work) {
        notFound()
    }

    // Try to guess the "current" greenhouse context from records or just take the most recent greenhouse overall
    // since the standard detail page might not have a specific greenhouse in the URL.
    // However, WorkRecordSave takes greenhouseName as a prop from something else? 
    // Wait, let's see how detail page handles greenhouses.
    // Detail page doesn't seem to have a GH context currently in params.

    // We can fetch the latest record globally or per-house if we identify the house. 
    // In WorkDetailPage, we don't know the house yet. But we can fetch ALL latest batch numbers 
    // and pass them if we had a house selector.
    // Looking at current WorkDetailPage: it renders AIConsultation and TimeCalculator.

    // Actually, let's check WorkRecordSave.tsx again.
    // It seems WorkRecordSave is used in the Detail page sidebar or similar? No, only in WorkDetailPage.
    // Let's find where it is used.

    return (
        <div className={styles.container}>
            <Link href="/search" className={styles.backLink}>← 検索に戻る</Link>

            <header className={styles.header}>
                <div className={styles.headerMain}>
                    <span className={styles.stageTag}>{work.stage}</span>
                    <h1 className={styles.title}>{work.workName}</h1>
                </div>
                <Link href={`/work/${id}/edit`} className={styles.editButton}>
                    ✎ 編集する
                </Link>
            </header>

            <div className={styles.grid}>
                <div className={styles.mainContent}>
                    {work.imageUrl && (
                        <div className={styles.mediaFrame}>
                            <img src={work.imageUrl} alt={work.workName} className={styles.workImage} />
                        </div>
                    )}

                    {work.videoUrl && (
                        <div className={styles.mediaFrame}>
                            <iframe
                                width="100%"
                                height="400"
                                src={work.videoUrl.replace('watch?v=', 'embed/')}
                                title="Work Video"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
                    )}

                    <section className={styles.section}>
                        <h2>作業目的</h2>
                        <p className={styles.text}>{work.purpose}</p>
                    </section>

                    <section className={styles.section}>
                        <h2>目標</h2>
                        <p className={styles.text}>{work.timingStandard}</p>
                    </section>

                    <section className={styles.section}>
                        <h2>作業手順</h2>
                        <div className={styles.markdownContent}>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{work.actionSteps}</ReactMarkdown>
                        </div>
                    </section>

                    <section className={styles.section}>
                        <h2>AI発蕾診断</h2>
                        <p>発蕾部分の写真を1枚アップロードするだけで、発蕾状態を簡易診断します。</p>
                        <AIConsultation workName={work.workName} />
                    </section>
                </div>

                <div className={styles.sidebar}>
                    <QuickWorkRecord standardTime10a={work.requiredTime10a} workName={work.workName} />
                    <div className={styles.impactCard}>
                        <h3>⚠️ 未実施のリスク</h3>
                        <p className={styles.riskText}>{work.riskIfNotDone}</p>
                    </div>

                    <div className={styles.impactCard}>
                        <h3>💎 品質への影響</h3>
                        <p>{work.impactOnQuality}</p>
                    </div>

                    <div className={styles.impactCard}>
                        <h3>📊 歩留まり・利益への影響</h3>
                        <p>{work.impactOnYield}</p>
                        <p className={styles.profitText}>{work.impactOnProfit}</p>
                    </div>

                    <div className={styles.metricsCard}>
                        <div className={styles.metric}>
                            <span>標準時間 (10a)</span>
                            <strong>{work.requiredTime10a} 時間</strong>
                        </div>
                        <div className={styles.metric}>
                            <span>難易度</span>
                            <strong>Level {work.difficultyLevel}</strong>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

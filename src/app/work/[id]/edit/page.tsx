
import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import EditForm from './EditForm'
import styles from './edit.module.css'
import Link from 'next/link'

export default async function EditWorkPage({
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

    return (
        <div className={styles.container}>
            <Link href={`/work/${id}`} className={styles.backLink}>← 詳細に戻る</Link>
            <h1 className={styles.title}>作業マニュアルの編集</h1>
            <p className={styles.subtitle}>「{work.workName}」の内容を更新します。</p>

            <EditForm work={work} />
        </div>
    )
}

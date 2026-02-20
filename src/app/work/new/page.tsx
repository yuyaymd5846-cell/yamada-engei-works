
import styles from './new.module.css'
import NewWorkForm from './NewWorkForm'
import Link from 'next/link'

export default function NewWorkPage() {
    return (
        <div className={styles.container}>
            <Link href="/search" className={styles.backLink}>← 検索に戻る</Link>
            <h1 className={styles.title}>新規作業の登録</h1>
            <p className={styles.subtitle}>新しい作業マニュアルを作成し、DBに追加します。</p>

            <NewWorkForm />
        </div>
    )
}


import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import styles from './layout.module.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Yamada Engei Work Manual DB',
  description: 'Standardized work manual and decision support system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <div className={styles.container}>
          <header className={styles.header}>
            <div className={styles.logo}>
              <Link href="/dashboard">山田園芸 作業マニュアルDB</Link>
            </div>
            <nav className={styles.nav}>
              <Link href="/dashboard" className={styles.navLink}>ダッシュボード</Link>
              <Link href="/search" className={styles.navLink}>作業検索</Link>
              <Link href="/records" className={styles.navLink}>作業実績</Link>
              <Link href="/schedule" className={styles.navLink}>工程表</Link>
              <Link href="/greenhouses" className={styles.navLink}>ハウス管理</Link>
              <Link href="/rotation" className={styles.navLink}>薬剤ローテーション</Link>
              <Link href="/analysis" className={styles.navLink}>分析</Link>
            </nav>
          </header>
          <main className={styles.main}>
            {children}
          </main>
          <footer className={styles.footer}>
            &copy; 2026 Yamada Engei
          </footer>
        </div>
      </body>
    </html>
  )
}

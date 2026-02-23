
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import styles from './layout.module.css'
import Header from '@/components/Header'

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
          <Header />
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

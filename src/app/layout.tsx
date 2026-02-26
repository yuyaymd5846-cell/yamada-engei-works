import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import styles from './layout.module.css'
import Header from '@/components/Header'
import { cookies } from 'next/headers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '山田園芸 作業マニュアルDB',
  description: '標準作業マニュアルと意思決定支援システム',
  manifest: '/manifest.webmanifest',
  themeColor: '#2e7d32',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '山田園芸',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const userName = cookieStore.get('yamada-username')?.value

  return (
    <html lang="ja">
      <body className={inter.className}>
        <div className={styles.container}>
          <Header userName={userName} />
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

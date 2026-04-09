import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { cookies } from 'next/headers'
import Header from '@/components/Header'
import './globals.css'
import styles from './layout.module.css'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  title: '山田園芸 作業マニュアルDB',
  description: '園芸作業マニュアルと日々の作業記録をまとめて管理するアプリです。',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '山田園芸',
  },
}

export const viewport: Viewport = {
  themeColor: '#2d5a27',
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

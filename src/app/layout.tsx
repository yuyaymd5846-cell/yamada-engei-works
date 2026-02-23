
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import styles from './layout.module.css'
import Header from '@/components/Header'
import { createClient } from '@/utils/supabase/server'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Yamada Engei Work Manual DB',
  description: 'Standardized work manual and decision support system',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <html lang="ja">
      <body className={inter.className}>
        <div className={styles.container}>
          <Header user={user} />
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

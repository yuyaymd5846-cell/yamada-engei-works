'use client'

import { useState } from 'react'
import Link from 'next/link'
import styles from './Header.module.css'
import { logout } from '@/app/login/actions'

export default function Header({ userName }: { userName?: string }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen)
    const closeMenu = () => setIsMenuOpen(false)

    return (
        <header className={styles.header}>
            <div className={styles.logo}>
                <Link href="/dashboard" onClick={closeMenu}>山田園芸 作業マニュアルDB</Link>
            </div>

            <button
                className={`${styles.hamburger} ${isMenuOpen ? styles.open : ''}`}
                onClick={toggleMenu}
                aria-label="メニューを開く"
            >
                <span></span>
                <span></span>
                <span></span>
            </button>

            <nav className={`${styles.nav} ${isMenuOpen ? styles.navOpen : ''}`}>
                <Link href="/dashboard" className={styles.navLink} onClick={closeMenu}>ダッシュボード</Link>
                <Link href="/search" className={styles.navLink} onClick={closeMenu}>作業検索</Link>
                <Link href="/records" className={styles.navLink} onClick={closeMenu}>作業実績</Link>
                <Link href="/schedule" className={styles.navLink} onClick={closeMenu}>工程表</Link>
                <Link href="/greenhouses" className={styles.navLink} onClick={closeMenu}>ハウス管理</Link>
                <Link href="/rotation" className={styles.navLink} onClick={closeMenu}>薬剤ローテーション</Link>
                <Link href="/analysis" className={styles.navLink} onClick={closeMenu}>分析</Link>

                <div className={styles.userSection}>
                    {userName && <span className={styles.userName}>{userName}さん</span>}
                    <form action={logout} className={styles.logoutForm}>
                        <button type="submit" className={styles.logoutButton}>ログアウト</button>
                    </form>
                </div>
            </nav>

            {isMenuOpen && <div className={styles.overlay} onClick={closeMenu}></div>}
        </header>
    )
}

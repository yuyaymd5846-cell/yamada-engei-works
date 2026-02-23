'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
    const password = formData.get('password') as string
    const workerName = formData.get('workerName') as string

    if (!password) {
        return { error: 'パスワードを入力してください' }
    }
    if (!workerName || workerName.trim() === '') {
        return { error: 'お名前を入力してください' }
    }

    const correctPassword = process.env.AUTH_PASSWORD
    if (!correctPassword) {
        return { error: 'サーバー設定エラー: AUTH_PASSWORDが未設定です' }
    }

    if (password !== correctPassword) {
        return { error: 'パスワードが正しくありません' }
    }

    // Set auth cookie (httpOnly, 30 days)
    const cookieStore = await cookies()
    cookieStore.set('yamada-auth', 'authenticated', {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
    })

    // Set username cookie (can be read by client for display, also used by API)
    cookieStore.set('yamada-username', workerName.trim(), {
        httpOnly: false, // Allow client side to read it for UI
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
    })

    redirect('/dashboard')
}

export async function logout() {
    const cookieStore = await cookies()
    cookieStore.delete('yamada-auth')
    redirect('/login')
}

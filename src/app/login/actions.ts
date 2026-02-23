'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
    const password = formData.get('password') as string

    if (!password) {
        return { error: 'パスワードを入力してください' }
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

    redirect('/dashboard')
}

export async function logout() {
    const cookieStore = await cookies()
    cookieStore.delete('yamada-auth')
    redirect('/login')
}

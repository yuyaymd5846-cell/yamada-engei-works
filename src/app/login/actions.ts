'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
        return { error: 'メールアドレスとパスワードを入力してください' }
    }

    // Debug: check env vars
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) {
        return { error: `環境変数未設定: URL=${url ? '✅' : '❌'}, KEY=${key ? '✅' : '❌'}` }
    }

    try {
        const supabase = await createClient()

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            console.error('Login error:', error.message)
            return { error: `ログインに失敗しました: ${error.message}` }
        }
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        console.error('Login exception:', msg)
        return { error: `接続エラー: ${msg} (URL: ${url.substring(0, 30)}...)` }
    }

    redirect('/dashboard')
}

export async function logout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
}

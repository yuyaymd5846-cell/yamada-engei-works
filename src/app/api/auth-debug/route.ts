import { NextResponse } from 'next/server'

export async function GET() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '(not set)'
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '(not set)'

    const info: Record<string, string> = {
        supabaseUrl: url,
        anonKeyPrefix: key.substring(0, 20) + '...',
        anonKeyLength: String(key.length),
    }

    // Try to actually fetch from Supabase
    try {
        const res = await fetch(`${url}/auth/v1/settings`, {
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`,
            },
        })
        info.authSettingsStatus = String(res.status)
        const body = await res.text()
        info.authSettingsBody = body.substring(0, 200)
    } catch (e: unknown) {
        info.fetchError = e instanceof Error ? e.message : String(e)
    }

    return NextResponse.json(info)
}

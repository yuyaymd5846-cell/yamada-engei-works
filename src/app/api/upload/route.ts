import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const BUCKET = 'work-photos'

// GET endpoint to verify deployment version
export async function GET() {
    return NextResponse.json({
        version: '2025-03-01-v7-json-base64',
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...'
    })
}

export async function POST(request: Request) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!supabaseUrl || !serviceRoleKey) {
            return NextResponse.json(
                { error: `設定エラー: URL=${!!supabaseUrl}, KEY=${!!serviceRoleKey}` },
                { status: 500 }
            )
        }

        const supabase = createClient(supabaseUrl, serviceRoleKey)

        // Parse as JSON instead of FormData
        const body = await request.json()
        const { image: base64String, name, type } = body

        if (!base64String) {
            return NextResponse.json({ error: 'No image data provided' }, { status: 400 })
        }

        console.log(`[Upload] Received JSON payload. name: ${name}, type: ${type}`)

        // Generate unique filename
        const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`

        // Convert Base64 string back to Buffer
        const buffer = Buffer.from(base64String, 'base64')

        console.log(`[Upload] Uploading via Supabase Client to: ${BUCKET}/${fileName}`)

        // Upload using official SDK
        const { data, error } = await supabase
            .storage
            .from(BUCKET)
            .upload(fileName, buffer, {
                contentType: type || 'image/jpeg',
                upsert: true
            })

        if (error) {
            console.error(`[Upload] Supabase SDK error:`, error)
            return NextResponse.json(
                { error: `Supabase error: ${error.message}` },
                { status: 500 }
            )
        }

        // Construct public URL
        const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(fileName)
        const publicUrl = publicUrlData.publicUrl

        console.log(`[Upload] Success: ${publicUrl}`)

        return NextResponse.json({ url: publicUrl })
    } catch (error: any) {
        console.error('[Upload] Server error:', error)
        return NextResponse.json(
            { error: `Server error: ${error.message}` },
            { status: 500 }
        )
    }
}



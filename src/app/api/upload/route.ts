import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const BUCKET = 'work-photos'

export async function POST(request: Request) {
    try {
        // Validate env vars
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error('Missing Supabase env vars:', {
                url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
                key: !!process.env.SUPABASE_SERVICE_ROLE_KEY
            })
            return NextResponse.json({ error: 'サーバー設定エラー: Supabase環境変数が未設定です' }, { status: 500 })
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        )

        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        // Generate unique filename
        const ext = file.name.split('.').pop() || 'jpg'
        const timestamp = Date.now()
        const fileName = `${timestamp}_${Math.random().toString(36).slice(2, 8)}.${ext}`

        // Convert File to ArrayBuffer then to Uint8Array for Supabase
        const arrayBuffer = await file.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)

        const { data, error } = await supabaseAdmin.storage
            .from(BUCKET)
            .upload(fileName, uint8Array, {
                contentType: file.type || 'image/jpeg',
                upsert: false
            })

        if (error) {
            console.error('Supabase upload error:', error)
            return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 })
        }

        // Get public URL
        const { data: urlData } = supabaseAdmin.storage
            .from(BUCKET)
            .getPublicUrl(data.path)

        return NextResponse.json({ url: urlData.publicUrl })
    } catch (error) {
        console.error('Upload error:', error)
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }
}

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const BUCKET = 'work-photos'

// GET endpoint to verify deployment version
export async function GET() {
    return NextResponse.json({
        version: '2025-03-01-v6-supabase-client',
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

        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        console.log(`[Upload] file: ${file.name}, size: ${file.size}, type: ${file.type}`)

        // Generate unique filename
        const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`

        // Get arrayBuffer natively and convert to Buffer for robust SDK handling
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        console.log(`[Upload] Uploading via Supabase Client to: ${BUCKET}/${fileName}`)

        // Upload using official SDK
        const { data, error } = await supabase
            .storage
            .from(BUCKET)
            .upload(fileName, buffer, {
                contentType: file.type || 'image/jpeg',
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



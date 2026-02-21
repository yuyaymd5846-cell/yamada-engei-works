import { NextResponse } from 'next/server'

const BUCKET = 'work-photos'

// Allow larger body for file uploads
export const config = {
    api: {
        bodyParser: false,
    },
}

// GET endpoint to verify deployment version
export async function GET() {
    return NextResponse.json({
        version: '2025-02-21-v3',
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

        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        // Generate unique filename
        const timestamp = Date.now()
        const fileName = `${timestamp}_${Math.random().toString(36).slice(2, 8)}.jpg`

        // Convert File to Buffer
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Upload directly via Supabase Storage REST API
        const uploadUrl = `${supabaseUrl}/storage/v1/object/${BUCKET}/${fileName}`

        const uploadRes = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'Content-Type': 'image/jpeg',
                'x-upsert': 'false'
            },
            body: buffer
        })

        if (!uploadRes.ok) {
            const errText = await uploadRes.text()
            return NextResponse.json(
                { error: `Supabase error (${uploadRes.status}): ${errText}` },
                { status: 500 }
            )
        }

        // Construct public URL
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${fileName}`

        return NextResponse.json({ url: publicUrl })
    } catch (error: any) {
        return NextResponse.json(
            { error: `Server error: ${error.message}` },
            { status: 500 }
        )
    }
}

import { NextResponse } from 'next/server'

const BUCKET = 'work-photos'

// GET endpoint to verify deployment version
export async function GET() {
    return NextResponse.json({
        version: '2025-03-01-v5',
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

        console.log(`[Upload] file: ${file.name}, size: ${file.size}, type: ${file.type}`)

        // Generate unique filename
        const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`

        // Get arrayBuffer (same pattern as working budding-check upload)
        const arrayBuffer = await file.arrayBuffer()

        // Upload directly via Supabase Storage REST API
        const uploadUrl = `${supabaseUrl}/storage/v1/object/${BUCKET}/${fileName}`
        console.log(`[Upload] Uploading to: ${uploadUrl}`)

        const uploadRes = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'Content-Type': file.type || 'image/jpeg',
                'x-upsert': 'true'
            },
            body: arrayBuffer
        })

        if (!uploadRes.ok) {
            const errText = await uploadRes.text()
            console.error(`[Upload] Supabase error (${uploadRes.status}):`, errText)

            // If bucket doesn't exist, give a helpful message
            if (uploadRes.status === 404 || errText.includes('not found')) {
                return NextResponse.json(
                    { error: `バケット "${BUCKET}" が存在しません。Supabase ダッシュボード → Storage からバケットを作成してください。` },
                    { status: 500 }
                )
            }

            return NextResponse.json(
                { error: `Supabase error (${uploadRes.status}): ${errText}` },
                { status: 500 }
            )
        }

        // Construct public URL
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${fileName}`
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



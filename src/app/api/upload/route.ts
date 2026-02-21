import { NextResponse } from 'next/server'

const BUCKET = 'work-photos'

export async function POST(request: Request) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!supabaseUrl || !serviceRoleKey) {
            return NextResponse.json(
                { error: `サーバー設定エラー: URL=${!!supabaseUrl}, KEY=${!!serviceRoleKey}` },
                { status: 500 }
            )
        }

        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        // Generate unique filename
        const ext = file.name.split('.').pop() || 'jpg'
        const timestamp = Date.now()
        const fileName = `${timestamp}_${Math.random().toString(36).slice(2, 8)}.${ext}`

        // Convert File to ArrayBuffer
        const arrayBuffer = await file.arrayBuffer()

        // Upload directly via Supabase Storage REST API
        const uploadUrl = `${supabaseUrl}/storage/v1/object/${BUCKET}/${fileName}`

        const uploadRes = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'Content-Type': file.type || 'image/jpeg',
                'x-upsert': 'false'
            },
            body: arrayBuffer
        })

        if (!uploadRes.ok) {
            const errText = await uploadRes.text()
            console.error('Supabase upload error:', uploadRes.status, errText)
            return NextResponse.json(
                { error: `Upload failed (${uploadRes.status}): ${errText}` },
                { status: 500 }
            )
        }

        // Construct public URL
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${fileName}`

        return NextResponse.json({ url: publicUrl })
    } catch (error: any) {
        console.error('Upload error:', error)
        return NextResponse.json(
            { error: `Upload failed: ${error.message}` },
            { status: 500 }
        )
    }
}

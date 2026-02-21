import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

const BUCKET = 'work-photos'

export async function POST(request: Request) {
    try {
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

        const { data, error } = await supabase.storage
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
        const { data: urlData } = supabase.storage
            .from(BUCKET)
            .getPublicUrl(data.path)

        return NextResponse.json({ url: urlData.publicUrl })
    } catch (error) {
        console.error('Upload error:', error)
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }
}

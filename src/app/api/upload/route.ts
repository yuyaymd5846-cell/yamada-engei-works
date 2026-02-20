
import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: Request) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File | null

        if (!file) {
            return NextResponse.json({ error: 'ファイルが見つかりません' }, { status: 400 })
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Unique filename
        const ext = path.extname(file.name) || '.jpg'
        const fileName = `${uuidv4()}${ext}`
        const relativePath = `/uploads/${fileName}`
        const absolutePath = path.join(process.cwd(), 'public', 'uploads', fileName)

        await writeFile(absolutePath, buffer)

        return NextResponse.json({
            url: relativePath,
            name: file.name
        })
    } catch (error) {
        console.error('Upload Error:', error)
        return NextResponse.json({ error: 'アップロードに失敗しました' }, { status: 500 })
    }
}

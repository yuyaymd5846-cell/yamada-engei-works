
import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

export async function GET() {
    try {
        const dbPath = path.join(process.cwd(), 'prisma', 'dev.db')

        if (!fs.existsSync(dbPath)) {
            return NextResponse.json({ error: 'Database file not found' }, { status: 404 })
        }

        const fileBuffer = fs.readFileSync(dbPath)

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Disposition': `attachment; filename="yamada_engei_backup_${new Date().toISOString().split('T')[0]}.db"`,
                'Content-Type': 'application/octet-stream',
            },
        })
    } catch (error) {
        console.error('Backup failed:', error)
        return NextResponse.json({ error: 'Failed to generate backup' }, { status: 500 })
    }
}

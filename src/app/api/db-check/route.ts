import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
    try {
        const count = await prisma.greenhouse.count()
        return NextResponse.json({ success: true, count })
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack,
            code: error.code
        }, { status: 500 })
    }
}

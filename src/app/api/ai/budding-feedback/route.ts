import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// 有効な専門家フィードバックラベル
const VALID_LABELS = [
    '発蕾は確認しやすい状態です',
    '発蕾はやや遅れ気味の可能性があります',
    '発蕾遅れの可能性があります',
    '画像だけでは判定が安定しません',
]

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { diagnosisId, expertLabel, expertNote } = body

        if (!diagnosisId) {
            return NextResponse.json(
                { error: '診断IDが指定されていません' },
                { status: 400 }
            )
        }

        if (!expertLabel || !VALID_LABELS.includes(expertLabel)) {
            return NextResponse.json(
                { error: '無効なラベルです' },
                { status: 400 }
            )
        }

        // BuddingDiagnosis レコードが存在するか確認
        const existing = await prisma.buddingDiagnosis.findUnique({
            where: { id: diagnosisId },
        })

        if (!existing) {
            return NextResponse.json(
                { error: '診断レコードが見つかりません' },
                { status: 404 }
            )
        }

        // フィードバックを保存
        const updated = await prisma.buddingDiagnosis.update({
            where: { id: diagnosisId },
            data: {
                expertLabel,
                expertNote: expertNote?.trim() || null,
                feedbackAt: new Date(),
            },
        })

        return NextResponse.json({
            success: true,
            id: updated.id,
            message: 'フィードバックを保存しました。ご協力ありがとうございます。',
        })

    } catch (error) {
        console.error('[budding-feedback] Error:', error)
        return NextResponse.json(
            { error: 'フィードバックの保存に失敗しました' },
            { status: 500 }
        )
    }
}

// 蓄積データのリスト取得（将来の管理画面用）
export async function GET() {
    try {
        const records = await prisma.buddingDiagnosis.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100,
            select: {
                id: true,
                imageUrl: true,
                predictedLabel: true,
                predictedScore: true,
                expertLabel: true,
                expertNote: true,
                feedbackAt: true,
                workName: true,
                createdAt: true,
            },
        })

        const total = await prisma.buddingDiagnosis.count()
        const withFeedback = await prisma.buddingDiagnosis.count({
            where: { expertLabel: { not: null } },
        })

        return NextResponse.json({
            records,
            stats: {
                total,
                withFeedback,
                feedbackRate: total > 0 ? Math.round((withFeedback / total) * 100) : 0,
            },
        })
    } catch (error) {
        console.error('[budding-feedback] GET Error:', error)
        return NextResponse.json({ error: 'データ取得に失敗しました' }, { status: 500 })
    }
}

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { GoogleGenerativeAI } from '@google/generative-ai'

// ─────────────────────────────────────────────────────────────
//  診断ラベル定義
// ─────────────────────────────────────────────────────────────
const LABELS = {
    GOOD: '発蕾は確認しやすい状態です',
    DELAYED: '発蕾遅れの可能性があります',
    UNCLEAR: '画像だけでは判定が安定しません',
} as const

type LabelKey = keyof typeof LABELS

interface DiagnosisResult {
    label: string
    score: number
    comment: string
}

// ─────────────────────────────────────────────────────────────
//  Gemini Vision API を使った発蕾診断
// ─────────────────────────────────────────────────────────────
async function analyzeBuddingWithGemini(
    imageBuffer: Buffer,
    mimeType: string
): Promise<DiagnosisResult> {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error('GEMINI_API_KEY が設定されていません')

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `
あなたは菊（きく）の栽培に詳しい農業専門家AIです。
この画像を見て、植物の「発蕾（はつらい）状態」を判定してください。

## 判定基準
非常にシンプルに、蕾があるかどうか・順調かだけを判定します。

- GOOD     : 成長点（中心部）に小さな蕾が見え始めている、または既に蕾がはっきりと確認できる。少し早めの小さな蕾の状態であっても、確認できれば順調（GOOD）とみなす。
- DELAYED  : 成長点に蕾の兆候が全く見られない、葉だけが展開していて発蕾が明確に遅れていると判断できる。
- UNCLEAR  : 葉の陰で中心が見えない、ピンボケ、暗すぎるなどにより判定が困難。

## 回答フォーマット（必ずこの形式で）

LABEL: (GOOD/DELAYED/UNCLEAR のいずれか)
SCORE: (0.00〜1.00、確信度)
COMMENT: (日本語で30〜50文字の補足説明。「中心部に小さな蕾が確認できるため順調です」など現状を簡潔に)

例：
LABEL: GOOD
SCORE: 0.90
COMMENT: 中心部に小さな蕾が見え始めており、発蕾は順調に進んでいると判断できます。
`

    const imagePart = {
        inlineData: {
            data: imageBuffer.toString('base64'),
            mimeType: mimeType as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/heic' | 'image/heif',
        },
    }

    const result = await model.generateContent([prompt, imagePart])
    const text = result.response.text()

    return parseGeminiResponse(text)
}

function parseGeminiResponse(text: string): DiagnosisResult {
    const labelMatch = text.match(/LABEL:\s*(GOOD|SLOW|DELAYED|UNCLEAR)/i)
    const scoreMatch = text.match(/SCORE:\s*([\d.]+)/i)
    const commentMatch = text.match(/COMMENT:\s*(.+)/i)

    const labelKey: LabelKey = (labelMatch?.[1]?.toUpperCase() as LabelKey) ?? 'UNCLEAR'
    const score = parseFloat(scoreMatch?.[1] ?? '0.5')
    const comment = commentMatch?.[1]?.trim() ?? '画像条件により判定が不安定です'

    return {
        label: LABELS[labelKey] ?? LABELS.UNCLEAR,
        score: Math.min(Math.max(score, 0), 1),
        comment,
    }
}

// ─────────────────────────────────────────────────────────────
//  フォールバック（APIキー未設定 or エラー時のスタブ）
// ─────────────────────────────────────────────────────────────
function analyzeBuddingStub(imageBuffer: Buffer): DiagnosisResult {
    const tiers: DiagnosisResult[] = [
        { label: LABELS.GOOD, score: 0.91, comment: '画像上では蕾形成が確認しやすい状態です（デモ）' },
        { label: LABELS.DELAYED, score: 0.31, comment: '画像上では発蕾遅れ傾向が疑われます（デモ）' },
        { label: LABELS.UNCLEAR, score: 0.45, comment: '別角度や別画像で再確認してください（デモ）' },
    ]
    const idx = Math.floor((imageBuffer.length % 100) / 34)
    return tiers[Math.min(idx, 2)]
}

// ─────────────────────────────────────────────────────────────
//  Supabase Storage アップロード
// ─────────────────────────────────────────────────────────────
const BUCKET = 'budding-images'

async function uploadToSupabase(arrayBuffer: ArrayBuffer, mimeType: string, originalName: string): Promise<string> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Supabase 環境変数が未設定')
    }

    const ext = originalName.split('.').pop() || 'jpg'
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`

    const res = await fetch(`${supabaseUrl}/storage/v1/object/${BUCKET}/${fileName}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': mimeType,
            'x-upsert': 'false',
        },
        body: arrayBuffer,
    })

    if (!res.ok) {
        throw new Error(`Upload failed: ${res.status} ${await res.text()}`)
    }

    return `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${fileName}`
}

// ─────────────────────────────────────────────────────────────
//  Route Handler
// ─────────────────────────────────────────────────────────────
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(request: Request) {
    try {
        const contentType = request.headers.get('content-type') || ''
        if (!contentType.includes('multipart/form-data')) {
            return NextResponse.json(
                { error: 'Content-Type は multipart/form-data が必要です' },
                { status: 400 }
            )
        }

        const formData = await request.formData()
        const imageFile = formData.get('image') as File | null
        const workName = (formData.get('workName') as string) || null

        if (!imageFile) {
            return NextResponse.json({ error: '画像ファイルが見つかりません' }, { status: 400 })
        }

        const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif', 'image/webp']
        if (!allowed.includes(imageFile.type)) {
            return NextResponse.json(
                { error: '対応形式: jpg / png / webp / heic' },
                { status: 400 }
            )
        }

        if (imageFile.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: 'ファイルサイズは 10MB 以下にしてください' },
                { status: 400 }
            )
        }

        const buffer = Buffer.from(await imageFile.arrayBuffer())

        // ── 1. 診断 ──────────────────────────────────────────
        let diagnosis: DiagnosisResult
        let usedModel = 'stub'

        if (process.env.GEMINI_API_KEY) {
            try {
                diagnosis = await analyzeBuddingWithGemini(buffer, imageFile.type)
                usedModel = 'gemini-1.5-flash'
            } catch (err) {
                console.warn('[budding-check] Gemini fallback to stub:', err)
                diagnosis = analyzeBuddingStub(buffer)
            }
        } else {
            diagnosis = analyzeBuddingStub(buffer)
        }

        // ── 2. 画像アップロード ───────────────────────────────
        let imageUrl = ''
        try {
            imageUrl = await uploadToSupabase(await imageFile.arrayBuffer(), imageFile.type, imageFile.name)
        } catch (err) {
            console.warn('[budding-check] Upload skip:', err)
        }

        // ── 3. DB 保存 ────────────────────────────────────────
        let diagnosisId: string | null = null
        try {
            const record = await prisma.buddingDiagnosis.create({
                data: {
                    imageUrl: imageUrl || 'upload-failed',
                    predictedLabel: diagnosis.label,
                    predictedScore: diagnosis.score,
                    predictedComment: diagnosis.comment,
                    workName,
                },
            })
            diagnosisId = record.id
        } catch (err) {
            console.warn('[budding-check] DB skip:', err)
        }

        return NextResponse.json({
            ...diagnosis,
            diagnosisId,
            imageUrl: imageUrl || null,
            usedModel, // デバッグ用（本番ではUIに出さなくてよい）
        })

    } catch (error) {
        console.error('[budding-check] Error:', error)
        return NextResponse.json(
            { error: '診断中にエラーが発生しました。時間をおいて再度お試しください' },
            { status: 500 }
        )
    }
}

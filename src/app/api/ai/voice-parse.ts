import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

interface VoiceParseRequest {
  transcript: string // 音声を文字起こししたテキスト
}

interface ParsedWorkRecord {
  workName: string
  greenhouseName: string | null
  spentTime: number
  note: string
  suggestedBatchNumber: string | null
}

export async function POST(request: NextRequest) {
  try {
    const body: VoiceParseRequest = await request.json()
    const { transcript } = body

    if (!transcript) {
      return NextResponse.json(
        { error: '音声を入力してください' },
        { status: 400 }
      )
    }

    // Claude APIで音声記録テキストを解析
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      system: `あなたは農業用の作業記録を解析するAIです。
ユーザーが音声で入力した作業内容から、以下のJSON形式で構造化データを抽出してください：
{
  "workName": "作業名（栽培管理、かん水、薬剤散布など）",
  "greenhouseName": "ハウス名（例：A-1, B-3など。不明な場合はnull）",
  "spentTime": 実際に作業に費やした時間（時間単位の数値。例：1.5, 2, 0.5）,
  "note": "その他の特記事項や見出された問題（例：アザミウマを発見など。特記事項がなければ空文字列）",
  "suggestedBatchNumber": "提及されていたバッチ番号があればそれ（例：'2024-01'、なければnull）"
}

重要：
1. 返すのはJSONオブジェクトのみで、他のテキストは含めないでください
2. spentTimeは必ず数値で返してください
3. 作業名が特定できない場合は「不明」と入力してください`,
      messages: [
        {
          role: 'user',
          content: `以下の音声記録を解析してください：\n\n「${transcript}」`
        }
      ]
    })

    // レスポンスからテキスト部分を抽出
    const textContent = response.content.find(block => block.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      return NextResponse.json(
        { error: '解析に失敗しました' },
        { status: 500 }
      )
    }

    // JSONをパース
    let parsedData: ParsedWorkRecord
    try {
      parsedData = JSON.parse(textContent.text)
    } catch (e) {
      // JSONパースに失敗した場合、テキストから抽出を試みる
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0])
      } else {
        console.error('JSON parse failed:', textContent.text)
        throw new Error('JSONのパースに失敗しました')
      }
    }

    return NextResponse.json({
      success: true,
      data: parsedData
    })
  } catch (error) {
    console.error('音声解析エラー:', error)
    return NextResponse.json(
      { error: '解析に失敗しました', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

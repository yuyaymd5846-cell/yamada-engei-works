
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import OpenAI from 'openai'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { work_name, house, variety, days_after_planting, plant_height_cm } = body

        // 1. Fetch relevant manual
        const manually = await prisma.workManual.findFirst({
            where: { workName: work_name }
        })

        if (!manually) {
            return NextResponse.json({ error: 'Work manual not found for: ' + work_name }, { status: 404 })
        }

        let analysisResult = ''

        if (process.env.OPENAI_API_KEY) {
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

            const prompt = `
      あなたは農業の専門家AIです。以下の作業マニュアルと現在の状況に基づいて、最適な判断とアドバイスを提供してください。
      
      【作業マニュアル】
      作業名: ${manually.workName}
      目的: ${manually.purpose}
      基準: ${manually.timingStandard}
      手順: ${manually.actionSteps}
      リスク: ${manually.riskIfNotDone}
      
      【現在の状況】
      ハウス: ${house}
      品種: ${variety}
      経過日数: 定植後${days_after_planting}日
      草丈: ${plant_height_cm}cm
      
      【回答フォーマット】
      1. 現状評価（順調/早い/遅い）
      2. 実施判断（今すぐ/待機/条件付き実施）
      3. 具体的なアドバイス
      4. リスク警告
      `

            const completion = await openai.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: 'gpt-4o',
            })

            analysisResult = completion.choices[0].message.content || 'AIからの回答が得られませんでした。'
        } else {
            // Mock response if no API key
            analysisResult = `
      【AI判断結果 (DEMO Mode)】
      ※ OpenAI API Keyが設定されていないため、デモ回答を表示しています。
      
      作業名: ${work_name}
      ハウス: ${house}
      品種: ${variety}
      
      現在の状況（定植${days_after_planting}日目, 草丈${plant_height_cm}cm）は、標準的な生育範囲内です。
      
      アドバイス:
      マニュアル基準「${manually.timingStandard}」と比較し、そろそろ実施の準備を始めてください。
      「${manually.riskIfNotDone}」のリスクを避けるため、天候の良い日を選んで実施しましょう。
      `
        }

        return NextResponse.json({
            analysis: analysisResult,
            source_manual: manually
        })

    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

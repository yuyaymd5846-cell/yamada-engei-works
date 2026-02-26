import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const b9WorkName = 'ビーナイン散布（B9）'

    // Check if exists, update if it does, create if it doesn't
    const existing = await prisma.workManual.findFirst({
        where: { workName: b9WorkName }
    })

    const data = {
        workName: b9WorkName,
        stage: '消灯前後～花首伸長期',
        purpose: '* 草丈の過伸長抑制\n* 節間を締める\n* 花首の伸びすぎ防止\n* 規格長内（80cm）に収める\n\nビーナインは\n「伸ばさない」ためではなく\n**“規格に合わせるため”の調整工程**',
        timingStandard: '① 消灯の日\n② 消灯1週間後\n③ 消灯2週間後（様子を見て判断）\n④ 消灯3週間後（草勢次第）\n\n### ■ 追加散布\n花首伸長期に\n首が伸びすぎそうな品種は追加実施する場合あり。',
        inputParameters: '[]',
        actionSteps: '## ■ 散布条件（固定）\n* 倍率：**1000倍**\n* 散布量：**5aあたり20L**\n* 展着剤：**スカッシュ混用**\n\n## ■ 混用について\nビーナイン散布時に、\n* 殺菌剤\n* 殺虫剤\nを同時に混用散布する。\n作業効率を高め、\n散布回数を増やさない。\n\n## ■ 使用回数\n1作につき **1回～4回程度**\n同一圃場で複数回使用する。\n\n## ■ 実施判断基準\n* 草丈が計画より強い\n* 節間が伸び気味\n* 首伸び傾向品種\n\n## ■ 品種による注意点\n* 感受性差あり\n* 回数が増える品種あり\n* 強く効きすぎる品種あり\n\n品種別履歴管理が重要。',
        riskIfNotDone: '## ■ 未実施のリスク\n* 草丈超過\n* 首伸び\n* 曲がり\n* 優品落ち\n\n## ■ 過剰散布のリスク\n* 草丈不足\n* 節間過度短縮\n* 花首短縮\n* ボリューム不足\n\n## ■ 品質・利益への影響\n* 2L率低下\n* L・M落ち増加\n* 出荷調整時間増\n\nビーナインは\n**単価を守る調整剤**',
        impactOnQuality: '',
        impactOnYield: '',
        impactOnProfit: '',
        requiredTime10a: 0.5,
        difficultyLevel: 4
    }

    if (existing) {
        const result = await prisma.workManual.update({
            where: { id: existing.id },
            data
        })
        console.log(`Updated manual "${b9WorkName}". ID: ${result.id}`)
    } else {
        const result = await prisma.workManual.create({
            data
        })
        console.log(`Created manual "${b9WorkName}". ID: ${result.id}`)
    }
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

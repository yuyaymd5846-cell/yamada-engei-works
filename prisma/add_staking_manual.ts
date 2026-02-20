
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const manuals = [
        {
            workName: '杭打ち',
            stage: '定植期',
            purpose: 'スプレーマムの伸長に合わせてフラワーネットを引き上げるため、支柱をたてる',
            timingStandard: '均等にしっかり展張できるように支柱を立てていく',
            actionSteps: JSON.stringify([
                '１．８ｍおきに支柱（杭）を立てておく',
                '先端がないものや曲がっているものは使用しない',
                '通路が通れるように畝と畝の間は杭の間隔を3マス程あけて立てる',
                '支柱(杭)の凸凹部分がネットの真ん中にかかるように、フラワーネットにテンションがかかるように真っすぐ立てる',
                '杭打機で２５～３０cmほど打ち込む(土汚れのある部分が目安)',
                'ネットを上げたときしっかり張るように畝の外側に向けてわずかななめになるようにする',
                '（マスプレーでかん水の場金）',
                '古いフラワーネットをホースが通る通路親杭にかけて張る',
                '高さ４０ｃｍ程度のところにＹ型ピンチでネットと支柱を留めておく',
                'ホースを伸ばしてマスプレーとつなぐ　一往復は動かして様子を見る'
            ]),
            riskIfNotDone: 'ネットが倒れて品質低下、作業効率の悪化',
            impactOnQuality: '品質への影響大',
            impactOnYield: '歩留まり低下の恐れ',
            impactOnProfit: '資材管理不足によるコストアップ',
            inputParameters: JSON.stringify({
                tools: ['杭打ち機', '混合油', 'Y型洗濯ピンチ']
            }),
            requiredTime10a: 75.0,
            difficultyLevel: 3
        }
    ]

    for (const m of manuals) {
        const existing = await prisma.workManual.findFirst({
            where: { workName: m.workName }
        })

        if (existing) {
            await prisma.workManual.update({
                where: { id: existing.id },
                data: m
            })
            console.log(`Updated: ${m.workName}`)
        } else {
            await prisma.workManual.create({
                data: m
            })
            console.log(`Created: ${m.workName}`)
        }
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

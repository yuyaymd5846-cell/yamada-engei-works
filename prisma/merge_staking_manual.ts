
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const originalId = '0e606639-33da-45c9-93e3-e14674928f90'
    const redundantIds = [
        '292b69fc-9dd3-41d8-ba97-fce4f4dabe48',
        '523f6bb7-c3ee-403e-9610-de3e4ba2b3b8'
    ]

    const newContent = {
        workName: '杭打ち',
        stage: '定植期',
        purpose: 'スプレーマムの伸長に合わせてフラワーネットを引き上げるため、支柱をたてる',
        timingStandard: '均等にしっかり展張できるように支柱を立てていく',
        actionSteps: [
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
        ].join('\n'), // Using newline format to match original style if preferred, or I can keep it as list if UI supports it.
        // Actually the existing one used \n, but let's make it more readable.
        riskIfNotDone: 'ネットが倒れて品質低下、作業効率の悪化',
        impactOnQuality: '品質への影響大',
        impactOnYield: '歩留まり低下の恐れ',
        impactOnProfit: '資材管理不足によるコストアップ',
        inputParameters: JSON.stringify({
            tools: ['杭打ち機', '混合油', 'Y型洗濯ピンチ'],
            note: '先端がないものや曲がっているものは使用しない'
        }),
        requiredTime10a: 75.0,
        difficultyLevel: 3
    }

    // Update original
    await prisma.workManual.update({
        where: { id: originalId },
        data: newContent
    })
    console.log(`Updated original manual: ${originalId}`)

    // Delete redundant
    for (const rid of redundantIds) {
        try {
            await prisma.workManual.delete({ where: { id: rid } })
            console.log(`Deleted redundant manual: ${rid}`)
        } catch (e) {
            console.log(`Manual already deleted or not found: ${rid}`)
        }
    }
}

main()
    .finally(() => prisma.$disconnect())

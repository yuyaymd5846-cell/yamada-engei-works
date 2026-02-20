
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const workName = "杭打ち"
    const actionSteps = `
### 準備するもの
- □杭打ち機
- □混合油
- □Y型洗濯ピンチ

### 手順と注意点
1. **支柱の配置**
   - 1.8mおきに支柱（杭）を立てておく
   - ！）先端がないものや曲がっているものは使用しない
   - ！）通路を確保するため、畝と畝の間は杭の間隔を3マス分ほどあけて立てる
2. **支柱の設置**
   - 支柱の凸凹部分がネットの真ん中にかかるように配置
   - フラワーネットにテンションがかかるよう真っすぐ立てる
3. **打ち込み作業**
   - 杭打機で25〜30cmほど打ち込む（土汚れのある部分が目安）
   - **ポイント**: ！）ネットを上げたときにしっかり張るよう、畝の外側に向けてわずかに斜めになるように打ち込む
4. **かん水準備（マスプレーの場合）**
   - 古いフラワーネットをホースが通る通路親杭にかけて張る
   - 高さ40cm程度のところにY型ピンチでネットと支柱を留めておく
   - ホースを伸ばしてマスプレーとつなぐ
   - 一往復は動かして様子（動作）を確認する
`.trim()

    const work = await prisma.workManual.findFirst({
        where: { workName }
    })

    if (work) {
        await prisma.workManual.update({
            where: { id: work.id },
            data: {
                purpose: 'スプレーマムの伸長に合わせてフラワーネットを引き上げるため、支柱をたてる。',
                timingStandard: '均等にしっかり展張できるように支柱を立てていく',
                actionSteps: actionSteps,
                riskIfNotDone: '倒伏、ネットの緩みによる生育不良、管理作業の効率低下。',
                impactOnProfit: '曲がり規格外品の防止（歩留まり向上）、かん水作業の安定化。',
            }
        })
        console.log(`Updated manual: ${workName}`)
    } else {
        await prisma.workManual.create({
            data: {
                workName,
                stage: '定植期',
                purpose: 'スプレーマムの伸長に合わせてフラワーネットを引き上げるため、支柱をたてる。',
                timingStandard: '均等にしっかり展張できるように支柱を立てていく',
                actionSteps: actionSteps,
                riskIfNotDone: '倒伏、ネットの緩みによる生育不良、管理作業の効率低下。',
                impactOnProfit: '曲がり規格外品の防止（歩留まり向上）、かん水作業の安定化。',
                inputParameters: JSON.stringify({}),
                requiredTime10a: 4.0,
                difficultyLevel: 3,
                impactOnQuality: '倒伏防止による曲がり低減',
                impactOnYield: '秀品率の維持',
            }
        })
        console.log(`Created manual: ${workName}`)
    }
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })


import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const workName = "採穂"
    const actionSteps = `
### 準備するもの
- □コンテナ・ポリ袋
- □新聞紙
- □マステ・マジック
- □ヘラ（カッティングナイフ）
- □発泡イス
- □バケツ

### 手順と注意点
1. **品種と列の確認**
   - 採るべき品種と列の間違いがないか確認する
2. **環境調整**
   - 遮光が必要な場合、遮光カーテンを使用する
3. **摘みとり作業**
   - ヘラに生長点を合わせて摘みとる
   - **重要**: ！）特に長さにバラつきがないように注意する
   - **検品**: ！）葉の形がおかしいもの、傷んでいるものはバケツに入れない
     - 例：花芽がついたもの、葉焼けなど
   - **品質**: ！）茎の切り口はきれいになるようにこころがける
4. **バケツへの収容**
   - ★最初の目標：**3秒に1本**のペースを目指す
5. **コンテナ詰め・梱包**
   - コンテナに新聞紙を敷き、採穂した穂木を入れる
   - マスキングテープで「日付」「品種名」を記入し貼付する
   - コンテナを袋に入れる
   - **重要**: ！）穂木に直射日光が当たらないように細心の注意を払う！
6. **保管**
   - 作業場の冷蔵庫に入れて鮮度を保持する
`.trim()

    const work = await prisma.workManual.findFirst({
        where: { workName }
    })

    if (work) {
        await prisma.workManual.update({
            where: { id: work.id },
            data: {
                purpose: '均質な生育のために、長さ・軸の太さが揃った穂木を準備する。',
                timingStandard: '①1,000本/hr以上 ② 1,500本/hr以上 ③ 2,000本/hr以上',
                actionSteps: actionSteps,
                riskIfNotDone: '生育のバラツキ、病害虫の混入、鮮度劣化による活着不良。',
                impactOnProfit: '均一な収穫（秀品率向上）、作業スピード向上による人件費削減。',
            }
        })
        console.log(`Updated manual: ${workName}`)
    } else {
        await prisma.workManual.create({
            data: {
                workName,
                stage: '育苗期',
                purpose: '均質な生育のために、長さ・軸の太さが揃った穂木を準備する。',
                timingStandard: '①1,000本/hr以上 ② 1,500本/hr以上 ③ 2,000本/hr以上',
                actionSteps: actionSteps,
                riskIfNotDone: '生育のバラツキ、病害虫の混入、鮮度劣化による活着不良。',
                impactOnProfit: '均一な収穫（秀品率向上）、作業スピード向上による人件費削減。',
                inputParameters: JSON.stringify({}),
                requiredTime10a: 30.0,
                difficultyLevel: 3,
                impactOnQuality: '長さ・太さの均一性',
                impactOnYield: '活着率の維持',
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

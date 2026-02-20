
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const workName = "圃場準備"
    const actionSteps = `
### 準備物
- □フラワーネット
- □抗打機
- □ピン(ネットの仮押さえ)
- □トンボ
- □巻き尺

### 手順と注意点
1. **トラクターで耕起(2回)**
2. **トンボで山になっている部分をならす**
3. **親杭打ち**
   - 散布・通路中に合わせて打つ
   - **ポイント**: 杭は少し斜めにして、ネットがしっかり張れるように工夫する
4. **フラワーネットの準備**
   - フラワーネットを親杭に合わせて配置
5. **フラワーネットの固定**
   - パイプを通して親杭に結びつける
   - **重要**: しっかりと張って「巻き結び」で固定する
6. **ピンでの仮押さえ**
   - ネットがたるまないように固定
   - 間隔は杭2スパンにつき1つ
7. **定植用苗の準備 (@④ハウス)**
   - ポリを外す
   - 消毒を行う
     - 薬剤: ジマンダイセン(1000倍)、グレーシア(3000倍)、ベストガード(1500倍)
     - 方法: ミニ動噴で散布。目安は約150枚で10ℓ程度
8. **苗の搬送**
   - 準備した圃場ハウスへ運ぶ
`.trim()

    const work = await prisma.workManual.findFirst({
        where: { workName }
    })

    if (work) {
        await prisma.workManual.update({
            where: { id: work.id },
            data: {
                purpose: '定植の準備・定植後に活着しやすい環境で整える',
                timingStandard: '目標：畝のネットを張ることができる(巻き結びできる)',
                actionSteps: actionSteps,
                riskIfNotDone: '活着不良、ネットの緩みによる生育障害や倒伏、病害虫の持ち込み。',
                impactOnProfit: '活着率の向上、その後の作業効率改善、初期病害虫の抑制。',
            }
        })
        console.log(`Updated manual: ${workName}`)
    } else {
        await prisma.workManual.create({
            data: {
                workName,
                stage: '準備期',
                purpose: '定植の準備・定植後に活着しやすい環境で整える',
                timingStandard: '目標：畝のネットを張ることができる(巻き結びできる)',
                actionSteps: actionSteps,
                riskIfNotDone: '活着不良、ネットの緩みによる生育障害や倒伏、病害虫の持ち込み。',
                impactOnProfit: '活着率の向上、その後の作業効率改善、初期病害虫の抑制。',
                inputParameters: JSON.stringify({}),
                requiredTime10a: 15.0,
                difficultyLevel: 4,
                impactOnQuality: '活着状況に直結',
                impactOnYield: '欠株防止',
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

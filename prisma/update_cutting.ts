
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const workName = "挿芽"
    const actionSteps = `
### 準備物
- □穂木
- □薬液(ビーナイン、オキシベロン、ファンタジスタ、アドマイヤー)
- □ソイルブロック

### 手順と注意点
1. **品種と枚数の確認**
   - ！）採穂日が20日以上前のものは黄化していないか特に注意する
2. **穂木の薬液処理**
   - 穂木を薬液に浸ける → 空のコンテナにあげてしっかりと水をきる
3. **挿し作業**
   - ソイルブロックに穂木を挿す
   - 穂木の基部が深さ1㎝程度埋まるようにする
   - ！）穂木がソイルブロックを突き抜けないように注意する
4. **トレイの整列**
   - 挿し終わったトレイを並べる（3トレイで1列になるように揃える）
   - ！）ある程度並んできたら、乾かないようにすぐにポリをかける
5. **品種の切り替え**
   - 最後のブロックトレイに品種名を記載した札を立てる
   - ！）枚数の最終確認
   - ！）次品種と混ざらないよう、周囲を徹底的に掃除しておく
6. **仕上げ・密閉**
   - 全てを挿し終えたら、ポリをしっかりとかぶせる
   - **重要**: ！）隙間があると乾いて発根しないため、しっかりとポリの端をトレイの下に挟み込む
`.trim()

    const work = await prisma.workManual.findFirst({
        where: { workName }
    })

    // Normalize search for variants like '挿し芽' or '挿芽'
    if (work) {
        await prisma.workManual.update({
            where: { id: work.id },
            data: {
                workName: "挿芽",
                purpose: '均質な生育のために発根状況が揃った苗で準備する',
                timingStandard: '①8分/枚 ②5分/枚 ・手順と注意点を理解する',
                actionSteps: actionSteps,
                riskIfNotDone: '発根不良、乾燥による苗の死滅、品種混ざり、生育のバラツキ。',
                impactOnProfit: '苗の歩留まり向上、定植後の均一な成長（収穫適期の集中）。',
            }
        })
        console.log(`Updated manual: ${workName}`)
    } else {
        await prisma.workManual.create({
            data: {
                workName,
                stage: '育苗期',
                purpose: '均質な生育のために発根状況が揃った苗で準備する',
                timingStandard: '①8分/枚 ②5分/枚 ・手順と注意点を理解する',
                actionSteps: actionSteps,
                riskIfNotDone: '発根不良、乾燥による苗の死滅、品種混ざり、生育のバラツキ。',
                impactOnProfit: '苗 of 歩留まり向上、定植後の均一な成長（収穫適期の集中）。',
                inputParameters: JSON.stringify({}),
                requiredTime10a: 20.0,
                difficultyLevel: 4,
                impactOnQuality: '苗の均一性',
                impactOnYield: '発根率への直結',
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

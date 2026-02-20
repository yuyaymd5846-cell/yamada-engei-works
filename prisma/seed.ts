
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const workItems = [
  { name: '土壌消毒', stage: '準備期', purpose: '連作障害の防止と病害虫の駆除', risk: '立枯病や生育不良の多発', impact: '秀品率が30%低下する恐れ' },
  { name: '採穂', stage: '育苗期', purpose: '健全な親株からの穂の確保', risk: 'ウィルス病の伝染', impact: '全滅のリスクあり' },
  { name: '挿芽', stage: '育苗期', purpose: '発根促進と均一な苗作り', risk: '発根不良による欠株', impact: '歩留まり低下' },
  { name: '施肥', stage: '準備期', purpose: '初期生育に必要な養分の供給', risk: '初期生育不良', impact: '切り花長不足' },
  { name: '圃場準備', stage: '準備期', purpose: '排水性・保水性の確保', risk: '根腐れや乾燥害', impact: '品質低下' },
  { name: '定植', stage: '定植期', purpose: '適切な栽植密度の確保', risk: '過密による蒸れ、徒長', impact: '秀品率低下' },
  { name: '杭打ち', stage: '定植期', purpose: 'フラワーネットの固定', risk: '倒伏', impact: '曲がりによる規格外品の発生' },
  { name: 'ヤゴかき', stage: '成長期', purpose: '栄養を主茎に集中させる', risk: '栄養分散による品質低下', impact: '上位等級比率の低下' },
  { name: '薬剤散布', stage: '全期間', purpose: '病害虫防除', risk: '病害虫の蔓延', impact: '商品価値の喪失' },
  { name: '栽培管理', stage: '全期間', purpose: '環境制御（温度・湿度）', risk: '生理障害の発生', impact: '奇形花の発生' },
  { name: '収穫', stage: '収穫期', purpose: '適期収穫による品質保持', risk: '採り遅れによる開花過多', impact: '市場評価の低下' },
  { name: '出荷調整', stage: '出荷期', purpose: '規格選別と荷姿を整える', risk: '規格混入', impact: 'クレーム発生' },
  { name: '出荷', stage: '出荷期', purpose: '鮮度保持と迅速な輸送', risk: '輸送中の品質劣化', impact: '廃棄ロス' },
  { name: '片付け', stage: '終了期', purpose: '次作への準備と害虫密度低減', risk: '次作への病害虫持ち越し', impact: '次作の減収' },
]

async function main() {
  console.log(`Start seeding ...`)
  for (const item of workItems) {
    const work = await prisma.workManual.create({
      data: {
        workName: item.name,
        stage: item.stage,
        purpose: item.purpose,
        timingStandard: '適期（マニュアル参照）',
        inputParameters: JSON.stringify({ days_after_planting: 'number', condition: 'string' }),
        actionSteps: '1. 手順を確認する\n2. 実施する\n3. 記録する',
        riskIfNotDone: item.risk,
        impactOnQuality: '品質への影響大',
        impactOnYield: '歩留まりへの影響あり',
        impactOnProfit: item.impact,
        requiredTime10a: 10.0, // 仮の数値
        difficultyLevel: 3,
      },
    })
    console.log(`Created work item: ${work.workName}`)
  }
  console.log(`Seeding finished.`)
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

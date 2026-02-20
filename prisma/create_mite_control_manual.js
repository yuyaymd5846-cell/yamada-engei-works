
const { PrismaClient } = require('@prisma/client')
const { v4: uuidv4 } = require('uuid')

const prisma = new PrismaClient()

async function main() {
    const richMarkdown = `
# ■ ハダニ特別防除（5月下旬～10月）
（ステージ：蕾形成期～収穫前）

---

## ■ 作業目的
* ハダニ密度を抑え込む
* 花弁変色・葉のかすり症状を防ぐ
* 優品落ちを防止する

ハダニは増殖速度が速いため、
**通常防除とは別に物理的に叩く工程**

---

## ■ 実施時期
* 5月下旬～10月
* 消灯後35～40日頃
* 蕾形成期～収穫前

高温期は特に重点管理。

---

## ■ 散布方法

### ■ 機械設定
* 両サイドノズル使用
* 圧力：4.0

---

### ■ 散布手順
1. 通路に入りながら散布
2. 葉裏を狙う
3. 下からあおるように噴霧
4. 葉裏に十分付着させる

葉裏に届かなければ効果なし。

---

## ■ 使用薬剤
* エコピタ（200倍）
* ペンタック（1500倍）
* アグリメック（1000倍）
* コロマイト（1500倍）
* グレーシア（4000倍）

※通常ローテーションとは別枠で管理

---

## ■ 実施判断
* 高温期は予防的に実施
* ダニ発生が見えた場合は即対応

---

## ■ 未実施のリスク
* 葉かすり症状
* 花弁変色
* 商品価値低下
* 優品落ち
* 抵抗性進行

---

## ■ 作業のポイント
* 圧力を落とさない
* 葉裏に当てる意識
* 下葉まで届かせる
* 散布ムラを作らない

---

## ■ 標準時間（10a）
通常散布とは別枠

---

## ■ 難易度
Level 4
（物理散布技術が重要）
`.trim()

    const newManual = await prisma.workManual.create({
        data: {
            id: uuidv4(),
            workName: 'ハダニ特別防除',
            stage: '収穫前',
            purpose: 'ハダニ密度を抑え込み、花弁変色・葉のかすり症状等による品質低下を防止する。',
            timingStandard: '5月下旬～10月、消灯後35～40日頃。予防および発生時。',
            actionSteps: richMarkdown,
            riskIfNotDone: '葉かすり症状、花弁変色が起き、商品価値が著しく低下（優品落ち）する。',
            requiredTime10a: 0,
            difficultyLevel: 4,
            impactOnQuality: '花弁・葉の美観維持、ハダニ被害の根本抑制',
            impactOnYield: 'ハダニによる壊滅的被害の回避',
            impactOnProfit: 'B品・規格外品の減少による売上最大化',
            inputParameters: JSON.stringify({
                timing: '消灯後35～40日',
                judgment: ['実施済み', '未実施']
            })
        }
    })

    console.log(`Created new "Mite Control" manual: ${newManual.id}`)
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect()
    })

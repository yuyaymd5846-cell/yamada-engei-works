
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    const terminalBudId = '803e64b5-2898-4eab-9b0b-3aa6689283a7'

    const richMarkdown = `
### 🎯 作業目的
スプレーマムの見栄えを整えるため、早咲きの頂花やバランスを崩す原因となる頂花を除去します。
> **💡 頂花取りを実施することで、出荷時の品質と評価が安定します。**

#### 🚀 目標
- **Lv.1**: 頂花取り対象品種のみを確実に実施する。
- **Lv.2**: 頂花と長果を正確に判別し、花首を残さず除去する。
- **基本ペース**: 1株あたり約2分以内を目指します。

---

### 📋 実施判断基準
- **⚠️ 重要**: 作業前に、その品種が**「頂花取り対応品種」**であることを必ず確認してください。
- 対応品種のみ実施し、非対応品種には行いません。

---

### 🕒 実施タイミング
- 蕾がはっきりと確認できる段階。
- 頂花が手際よく判別できる状態になったら開始します。
- 収穫の直前期（栽培期間の終盤、ヤゴかきと近い時期）に行います。

---

### 📋 作業手順

#### 1. 頂花の判別
- 最初は確実に頂花であることを見極めます。
- 慣れてきたらスピードを意識し、作業の効率化を図ります。

#### 2. 除去作業
- 判別した頂花のみを摘み取ります。
- **ポイント**: 後で見苦しくないよう、**花首が極力残らないよう**に根本から取り除きます。

---

### ✅ 作業チェックポイント
- [ ] 対象品種であることを確認したか
- [ ] 頂花を正確に判別できているか
- [ ] 花首が残っていないか

---

### 📉 未実施のリスク
- 見栄えの悪化、優品への格下げ、出荷時の市場評価の低下。

### 📅 標準時間（10a）
- 目標：品種ごとの特性や熟練度により調整。
- 作業の難易度：**Level 2**（判別ができれば単純な手作業です）。
`.trim()

    await prisma.workManual.update({
        where: { id: terminalBudId },
        data: {
            purpose: '早咲き頂花やバランスを崩す頂花を除去し、見栄えと出荷品質を安定させる。',
            timingStandard: '収穫直前期。蕾が確認できる段階。目標: 1株あたり約2分。',
            actionSteps: richMarkdown,
            riskIfNotDone: '優品落ち、見栄え悪化、出荷評価低下',
            requiredTime10a: 35, // Adjusted from 10 to a more realistic standard based on 2min/plant
            difficultyLevel: 2,
            impactOnQuality: '品質・見栄えへの影響大。出荷時の市場評価を左右する',
            impactOnYield: '秀品率・等級評価への影響あり',
            inputParameters: JSON.stringify({
                notes: ['品種の適合確認', '正確な判別', '花首の処理']
            })
        }
    })

    console.log(`Updated "Terminal Bud Removal" manual with rich markdown: ${terminalBudId}`)
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect()
    })

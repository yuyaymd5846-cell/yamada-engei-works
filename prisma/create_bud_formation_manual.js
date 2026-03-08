
const { PrismaClient } = require('@prisma/client')
const { v4: uuidv4 } = require('uuid')

const prisma = new PrismaClient()

async function main() {
    const richMarkdown = `
### 🎯 作業目的
消灯後の花芽分化が正常に進んでいるかを確認し、開花遅延のリスクを早期に把握します。

#### 🚀 目標
- 消灯から約20日が経過した圃場を確実に巡回する。
- 蕾の状態を目視で正確に判別する。

---

### 🕒 実施基準
- **タイミング**: 消灯から **約20日後**。
- **確認内容**: 成長点付近を観察し、蕾が目視できるかを確認します。

---

### 📋 判定と対応

#### 1. 蕾が確認できる場合
- **判定**: 生育は概ね順。
- **対応**: 現行の管理を継続します。

#### 2. 蕾が確認できない場合
- **判定**: **開花遅延の懸念あり**。
- **推奨対応**: 
  - 温度管理（夜温の確保等）の見直し。
  - 栽培工程（潅水・追肥等）の再検討。
  - > **⚠️ 早期の気づきが、出荷スケジュールの致命的なズレを防ぎます。**

---

### 📉 未実施・不備のリスク
- 開花遅れの発見が遅れ、出荷時期がずれる。
- 計画外の出荷により、市場評価や受取単価が下落する。

### 💎 品質・利益への影響
- 正確な「適期出荷」は、農園の信頼と最高単価の獲得に直結します。
- 栽培管理の一環として、この短い確認作業が経営的な安全弁となります。

---

### 📅 標準情報
- **作業者熟練度**: 蕾の判別ができれば容易（日常の巡回に含まれます）。
- **目標時間**: 設定なし（日常管理工程として実施）。
`.trim()

    const newManual = await prisma.workManual.create({
        data: {
            id: uuidv4(),
            workName: '発蕾確認',
            stage: '収穫前',
            purpose: '花芽分化の正常な進行を確認し、開花遅延リスクを早期に把握する。',
            timingStandard: '消灯後約20日。目標時間設定なし。',
            actionSteps: richMarkdown,
            riskIfNotDone: '開花遅れの発見遅延、出荷時期ずれ、単価下落',
            requiredTime10a: 0,
            difficultyLevel: 1,
            impactOnQuality: '出荷適期の正確な把握による品質評価の維持',
            impactOnYield: '出荷スケジュールの精度向上',
            impactOnProfit: '出荷時期のズレによるロス防止。最高単価での販売機会を逃さない',
            inputParameters: JSON.stringify({
                timing: '消灯後20日',
                judgment: ['確認済み', '未確認']
            })
        }
    })

    console.log(`Created new "Bud Formation Check" manual: ${newManual.id}`)
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect()
    })

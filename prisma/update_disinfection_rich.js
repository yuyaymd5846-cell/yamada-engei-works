
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    const disinfectionId = '33b7ecdf-29f3-40a2-8e90-e52841ddebb6'

    const richMarkdown = `
### 🎯 作業目的
連作障害の防止および土壌病害（特にフザリウム・立枯病）の抑制。健全な初期生育を確保し、歩留まりと秀率を安定させます。

#### 🚀 目標
- 病原菌密度の低減
- 定植後の活着揃い
- 初期生育の均一化

---

### 🛠 使用資材・機械
- [ ] **テロン** または **ソイリーン**
- [ ] **土壌消毒器（マメトラ）**
- [ ] **土壌消毒フィルム**

#### 🧪 薬剤選択基準
- **通常期**: テロン または ソイリーン
- **高温期・夏秋系定植前**: **必ずソイリーンを使用**（フザリウム対策）

---

### 📋 作業手順

#### 1. 圃場整地
- 耕耘後、土壌を均平にします。
- 適度な土壌水分を確保します。

#### 2. 薬剤注入
- マメトラを使用し均一に注入します。
- 深さ・間隔を一定に保ち、注入漏れがないよう確認します。

#### 3. 被覆
- 土壌消毒フィルムで全面被覆します。
- 端部を確実に密閉し、風で浮かないよう固定します。

#### 4. 消毒期間確保
- 規定日数を確実に確保します。
- 途中でフィルム破れがないか定期的に確認します。

#### 5. 被覆除去・ガス抜き
- 十分なガス抜き期間を確保します。
- ガスが残らないよう、換気を徹底してください。

---

### ⚠️ 消毒終了後の留意点
- ハウス内を高温状態にします。
- 夏季は機器への影響を考慮します。
- 天窓開放時の風でフィルムが巻き上がらないよう、**下層カーテンを閉じて**作業を行います。

---

### 📉 未実施のリスク
- 立枯病多発、フザリウム増加、活着不良
- 草丈のバラつき、歩留まりの低下

### 💎 品質・利益への影響
- **品質**: 初期根量不足 → 茎径不足 → 2L率の低下
- **利益**: 歩留まり・秀率の低下による出荷箱数の減少
`.trim()

    await prisma.workManual.update({
        where: { id: disinfectionId },
        data: {
            purpose: '連作障害の防止および土壌病害（特にフザリウム・立枯病）の抑制。',
            timingStandard: '病原菌密度の低減、定植後の活着揃い、初期生育の均一化',
            actionSteps: richMarkdown,
            riskIfNotDone: '立枯病多発、フザリウム増加、活着不良、草丈バラつき、歩留まり低下',
            requiredTime10a: 2,
            difficultyLevel: 3,
            impactOnQuality: '初期根量不足 → 茎径不足 → 2L率低下',
            impactOnYield: '歩留まり低下、秀率低下、出荷箱数減少',
            inputParameters: JSON.stringify({
                chemicals: ['テロン', 'ソイリーン'],
                tools: ['マメトラ', '土壌消毒フィルム']
            })
        }
    })

    console.log(`Updated "Soil Disinfection" manual with rich markdown: ${disinfectionId}`)
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect()
    })


const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    const fertilizationId = '2a7ff352-870b-497f-9507-4f148ca756c1'

    const richMarkdown = `
### 🎯 作業目的
- 生育初期から安定した草勢を確保します。
- 茎径・葉枚数を安定させ、**秀2L率を高めます**。
- 過不足のない養分設計で歩留まりを安定させます。

#### 🚀 目標
- **土壌EC**: 0.5〜0.8
- **pH**: 6.0前後
- **原則**: 基肥を基本とし、追肥は行いません。

---

### 🧪 基本施肥設計（150坪＝約5a基準）
- [ ] **NKロング（70日型）**: 30kg
- [ ] **尿素**: 10kg
- [ ] **硫酸カリ**: 20kg
- [ ] **炭酸苦土石灰**: 40kg
> ※面積に応じて比例計算してください。液肥は使用しない前提です。

---

### 📋 作業手順

#### 1. 土壌診断確認
- 作業前に必ず **pH** と **EC** の数値を確認します。

#### 2. 苦土石灰量の調整
- **pH6前後**: 通常量（40kg/150坪）を施用。
- **pHが低い**: 不足分を計算して増量。
- **pHが高い**: 減量を検討してください。
- > **⚠️ 注意**: 過剰施用は微量要素欠乏やEC上昇のリスクがあります。

#### 3. 肥料散布
- **使用機械**: グリーンサンパー（背負い式散布機）
- **徹底事項**: 散布ムラを作らないよう、**均一散布**を徹底します。

#### 4. 耕耘混和
- 散布後は均一に混和し、局所的な高濃度状態を防ぎます。

#### 5. たい肥施用（時間がある場合）
- 有機物補給による団粒構造改善のため、可能な限り施用を検討します。
- **使用機械**: 運搬機、攪拌式肥料撒布機

---

### 📉 未実施・設計不良のリスク
- 徒長、茎径不足、葉色不良
- EC過剰による根傷み、秀率の低下

### 💎 品質・利益への影響
- **品質**: 茎径不足 → L・M落ち / 過剰窒素 → 軟弱化・日持ち低下 / カリ不足 → 花弁が弱くなる
- **利益**: 初期根傷みによる欠株増加、2L率低下、肥料費過多（経費増）
`.trim()

    await prisma.workManual.update({
        where: { id: fertilizationId },
        data: {
            purpose: '生育初期から安定した草勢を確保し、秀2L率を高める。',
            timingStandard: '土壌EC: 0.5〜0.8、pH: 6.0前後、基肥メイン',
            actionSteps: richMarkdown,
            riskIfNotDone: '徒長、茎径不足、葉色不良、EC過剰、根傷み、秀率低下',
            requiredTime10a: 3,
            difficultyLevel: 3,
            impactOnQuality: '茎径不足 → L・M落ち、軟弱化、花弁の弱化',
            impactOnYield: '初期根傷み → 欠株増加、2L率低下、肥料費過多',
            inputParameters: JSON.stringify({
                fertilizers: ['NKロング', '尿素', '硫酸カリ', '炭酸苦土石灰'],
                tools: ['グリーンサンパー', '耕耘機']
            })
        }
    })

    console.log(`Updated "Fertilization" manual with rich markdown: ${fertilizationId}`)
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect()
    })

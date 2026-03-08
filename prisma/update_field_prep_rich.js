
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    const fieldPrepId = 'e75d6761-7ef4-4a4d-b544-fb5d6d5a5650'

    const richMarkdown = `
### 🎯 作業目的
定植の準備を行い、定植後に**活着しやすい環境**で圃場を整えます。

#### 🚀 目標
- 畝のネットを張ることができる（巻き結びが確実にできる）。

---

### 🛠 準備するもの
- [ ] **フラワーネット**
- [ ] **杭打機**
- [ ] **ピン**（ネットの仮押さえ用）
- [ ] **トンボ**
- [ ] **巻き尺**

---

### 📋 手順と注意点

#### 1. 耕起とならし
- **トラクター耕起**: トラクターで2回、しっかりと耕起します。
- **ならし作業**: トンボを使い、山になっている部分を平らにならします。

#### 2. 親杭打ちとネット配置
- **親杭打ち**: 散布・通路の幅に合わせて親杭を打ちます。
  - > **⚠️ ポイント**: 杭は**わずかに斜め**に打ち込みます。これによりネットにしっかりとテンションをかけられます。
- **ネット配置**: フラワーネットを親杭の幅に合わせてセットします。

#### 3. ネットの固定
- **巻き結び**: パイプを通し、フラワーネットを親杭に結びつけます。
  - > **⚠️ 重要**: たるみが出ないよう、**しっかりと張って「巻き結び」**を行います。
- **仮押さえ**: ネットがたるまないようピンで固定します。
  - **間隔**: 杭2スパンにつき1箇所を目安にします。

#### 4. 苗の準備（＠④ハウス）
- **ポリ外し**: 定植用苗のポリ袋を外します。
- **苗の消毒**: ミニ動噴を使用し、以下の薬剤を散布します（約150枚に対し10ℓ程度）。
  - **ジマンダイセン**：1000倍
  - **グレーシア**：3000倍
  - **ベストガード**：1500倍
- **搬入**: 準備が整った苗を、圃場準備が完了したハウスへ運びます。
`.trim()

    await prisma.workManual.update({
        where: { id: fieldPrepId },
        data: {
            purpose: '定植の準備・定植後に活着しやすい環境で整える',
            timingStandard: '目標: 畝のネットを張ることができる(巻き結びできる)',
            actionSteps: richMarkdown,
            riskIfNotDone: '定植後の活着不全、作業効率の悪化、品質低下',
            requiredTime10a: 8,
            difficultyLevel: 3,
            inputParameters: JSON.stringify({
                tools: ['フラワーネット', '杭打機', 'ピン', 'トンボ', '巻き尺'],
                chemicals: ['ジマンダイセン', 'グレーシア', 'ベストガード']
            })
        }
    })

    console.log(`Updated "Field Prep" manual with rich markdown: ${fieldPrepId}`)
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect()
    })

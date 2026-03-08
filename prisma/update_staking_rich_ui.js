
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    const originalId = '0e606639-33da-45c9-93e3-e14674928f90'

    const richMarkdown = `
### 🛠 準備物品
- [ ] **杭打ち機**（動作確認、燃料チェック）
- [ ] **混合油**
- [ ] **Y型洗濯ピンチ**
- [ ] **支柱（杭）**（先端があり曲がっていないもの）

---

### 📋 基本手順
1. **支柱の配置**
   - **1.8mおき**に支柱（杭）を立てておきます。
   - 通路を確保するため、畝と畝の間は杭の間隔を**3マス程あけて**立てます。

2. **支柱立てのコツ**
   - 支柱(杭)の凸凹部分がネットの真ん中にかかるように調整します。
   - フラワーネットにしっかりテンションがかかるように**真っすぐ**立てます。
   - 杭打機で**25〜30cmほど**（土汚れのある部分が目安）打ち込みます。

3. **仕上げの調整**
   - ネットを上げた際にしっかり張るよう、畝の外側に向けて**わずかに斜め**になるように打ち込むのがポイントです。

---

### 💧 マスプレー（かん水）の場合の追加手順
- 古いフラワーネットをホースが通る通路親杭にかけて張ります。
- 高さ**40cm程度**のところに、Y型ピンチでネットと支柱を留めておきます。
- ホースを伸ばしてマスプレーと接続し、**一往復は必ず動かして**様子を確認します。
`.trim()

    await prisma.workManual.update({
        where: { id: originalId },
        data: {
            actionSteps: richMarkdown
        }
    })

    console.log(`Updated manual with rich markdown: ${originalId}`)
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect()
    })

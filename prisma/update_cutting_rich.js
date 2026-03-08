
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    const cuttingId = 'cce4931e-cf05-4591-9783-4e42ed30f4af'

    const richMarkdown = `
### 🎯 作業目的
均質な生育のために、**長さ・軸の太さが揃った**穂木を準備する。

#### 🚀 目標ペース
- **Lv.1**: 1,000本/hr 以上
- **Lv.2**: 1,500本/hr 以上
- **Lv.3**: 2,000本/hr 以上
- ★ **最初の目標**: 3秒に1本のペース！

---

### 🛠 準備するもの
- [ ] **コンテナ・ポリ袋**
- [ ] **新聞紙**
- [ ] **マステ・マジック**
- [ ] **ヘラ（カッティングナイフ）**
- [ ] **発泡イス**
- [ ] **バケツ**

---

### 📋 手順と注意点
#### 1. 作業開始の確認
- [ ] 採るべき**品種**と**列**を必ず確認します。
- [ ] 強い日差しがある場合は、**遮光カーテン**を使用してください。

#### 2. 摘みとり動作
- **生長点の位置合わせ**: ヘラに生長点を合わせて正確に摘みとります。
- **品質チェック**: 以下のものはバケツに入れず、除外してください。
  - 葉の形がおかしいもの
  - 傷んでいるもの
  - **花芽**がついたもの
  - **葉焼け**しているもの
- **切り口の美しさ**: 茎の切り口がきれいになるよう意識しましょう。

> **⚠️ 重要**: 特に**長さのバラつき**がないように細心の注意を払ってください！

#### 3. 保管と搬出
1. コンテナに新聞紙を敷き、穂木を詰めます。
2. コンテナのマスキングテープに**日付・品種名**を記入して貼り付けます。
3. コンテナをポリ袋に入れます。
4. **直射日光を避け**、速やかに作業場の冷蔵庫へ搬入します。
`.trim()

    await prisma.workManual.update({
        where: { id: cuttingId },
        data: {
            purpose: '均質な生育のために、長さ・軸の太さが揃った穂木を準備する。',
            timingStandard: '目標: 1,000〜2,000本/hr、3秒に1本のペース',
            actionSteps: richMarkdown,
            riskIfNotDone: '生育の不揃い、欠株の発生、品質低下',
            requiredTime10a: 75,
            difficultyLevel: 3,
            inputParameters: JSON.stringify({
                tools: ['コンテナ', '新聞紙', 'ヘラ', '発泡イス', 'バケツ']
            })
        }
    })

    console.log(`Updated "Cutting" manual with rich markdown: ${cuttingId}`)
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect()
    })

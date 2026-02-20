
const { PrismaClient } = require('@prisma/client')
const { v4: uuidv4 } = require('uuid')

const prisma = new PrismaClient()

async function main() {
    const richMarkdown = `
# ■ 消灯
（ステージ：定植後20～25日）

---

## ■ 作業目的
* 花芽分化を開始させる
* 開花時期を計画通りに誘導する
* 作型を確定させる

消灯＝開花スケジュールのスイッチ

---

## ■ 実施基準
* 定植後20～25日を目安
* 品種により前後あり
* 草勢・活着状況を確認して判断

---

## ■ 作業内容

### ① 夜間電照の停止
* 電照タイマーを停止
* 実際に消灯されているか確認

---

### ② 遮光確認（2月後半～11月）
* サイドシェードが完全遮光されているか
* 上部シェードが完全遮光されているか
* 光漏れがないか確認

光漏れ＝花芽分化不良
→ 開花遅延

---

### ③ 加温期の温度設定確認
* 温度設定が適正か確認

昼温管理：
* 午前中：25～28℃
* 13～15時：20℃
* その後：保温のため30℃設定

温度不足 → 分化遅延
温度過多 → 草勢乱れ

---

### ④ CO₂発生装置の管理（閉鎖期）
* 密閉期間中はCO₂施用量に注意
* 過剰施用はエチレン暴露リスク

エチレン暴露
→ 開花遅延
→ 不揃い

---

## ■ 時期別注意点
* 冬期：温度優先管理
* 春～秋：遮光優先管理

---

## ■ 未実施・管理不良のリスク
* 花芽分化不良
* 開花遅延
* 出荷時期ずれ
* 単価下落

消灯ミス＝作型崩壊

---

## ■ 品質・利益への影響
* 開花遅れ → 需要期外れ
* 草勢乱れ → 2L率低下
* 分化不良 → 輪数不足

---

## ■ 標準時間（10a）
管理確認工程（時間設定なし）

---

## ■ 難易度
Level 5
（作型設計と環境制御の理解が必要）
`.trim()

    const newManual = await prisma.workManual.create({
        data: {
            id: uuidv4(),
            workName: '消灯',
            stage: '定植後',
            purpose: '花芽分化を開始させ、開花時期を計画通りに誘導する。',
            timingStandard: '定植後20～25日。管理確認工程。',
            actionSteps: richMarkdown,
            riskIfNotDone: '花芽分化不良、開花遅延、出荷時期ずれ、単価下落、作型崩壊',
            requiredTime10a: 0,
            difficultyLevel: 5,
            impactOnQuality: '開花時期の斉一性確保、輪数確保',
            impactOnYield: '需要期に合わせた適期出荷の実現',
            impactOnProfit: '出荷時期のズレによるロス防止。最高単価での販売機会の獲得',
            inputParameters: JSON.stringify({
                timing: '定植後20～25日',
                judgment: ['実施済み', '未実施']
            })
        }
    })

    console.log(`Created new "Lights Off" manual: ${newManual.id}`)
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect()
    })

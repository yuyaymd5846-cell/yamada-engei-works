# 山田園芸ワークス

菊（キク）栽培農家のための営農管理Webアプリケーションです。
日々の作業マニュアル、ハウス管理、作業記録、スケジュール管理などを一元化し、効率的な農場運営をサポートします。

## 主な機能

- **ダッシュボード** — 今日やるべき作業を作付けスケジュールから自動算出し、優先度順に表示
- **作業マニュアル** — 各工程（定植・消灯・収穫など）の手順・目的・リスクを管理
- **作業記録** — 日々の作業実績（時間・担当者・写真）を記録しCSVエクスポート対応
- **ハウス管理** — 複数のハウス（温室）の面積・農薬ローテーション状態を管理
- **作付けスケジュール** — ガントチャートで作付け計画を可視化
- **農薬ローテーション** — 薬剤散布のローテーション管理と緊急アラート
- **データ分析** — 作業時間のトレンド・ハウス間比較・作業分布のグラフ表示
- **AI発蕾診断** — 写真からつぼみの状態をAIで判定（Google Gemini連携）
- **トラブル記録** — 病害虫の発見・例外作業の記録と写真の保存

## 技術スタック

- **フレームワーク**: Next.js 15 (App Router)
- **言語**: TypeScript
- **データベース**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **AI**: Google Gemini / OpenAI
- **ストレージ**: Supabase Storage（作業写真）
- **デプロイ**: Vercel

## セットアップ

```bash
npm install
```

環境変数（`.env`）を設定:

```
DATABASE_URL=your_database_url
DIRECT_URL=your_direct_url
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
GEMINI_API_KEY=your_gemini_key
```

データベースの初期化:

```bash
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
```

開発サーバーの起動:

```bash
npm run dev
```

## ライセンス

Private

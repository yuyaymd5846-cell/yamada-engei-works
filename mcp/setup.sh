#!/bin/bash
# =====================================================
# 山田園芸ワークス MCP セットアップスクリプト（Mac / Linux用）
# =====================================================
# 使い方:
#   cd yamada-engei-works/mcp
#   bash setup.sh
# =====================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MCP_NAME="yamada-engei"

echo ""
echo "🌼 山田園芸ワークス MCP セットアップ"
echo "======================================"

# Node.js の確認
if ! command -v node &> /dev/null; then
  echo "❌ Node.js がインストールされていません。"
  echo "   https://nodejs.org からインストールしてください。"
  exit 1
fi

echo "✅ Node.js: $(node --version)"

# npm install
echo ""
echo "📦 パッケージをインストール中..."
npm install --prefix "$SCRIPT_DIR"
echo "✅ インストール完了"

# APIキーの確認
echo ""
if [ -z "$YAMADA_API_KEY" ]; then
  echo "🔑 YAMADA_API_KEY を入力してください:"
  read -r API_KEY
  if [ -z "$API_KEY" ]; then
    echo "❌ APIキーが入力されませんでした。"
    exit 1
  fi
else
  API_KEY="$YAMADA_API_KEY"
  echo "✅ YAMADA_API_KEY: 環境変数から読み込みました"
fi

# claude mcp add で登録
echo ""
echo "🔧 Claude Code にMCPサーバーを登録中..."
claude mcp add "$MCP_NAME" \
  -e YAMADA_API_KEY="$API_KEY" \
  -- node "$SCRIPT_DIR/index.js"

echo ""
echo "======================================"
echo "✅ セットアップ完了！"
echo ""
echo "次のステップ:"
echo "  1. Claude Code を再起動する"
echo "  2. 「ハウスの状況を教えて」などと話しかける"
echo "======================================"

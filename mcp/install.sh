#!/bin/bash
# =====================================================
# 山田園芸ワークス MCP ワンコマンドインストーラー
# =====================================================
# 使い方（Mac / Linux）:
#
#   curl -fsSL https://raw.githubusercontent.com/yuyaymd5846-cell/yamada-engei-works/main/mcp/install.sh | bash
#
# APIキーを指定する場合:
#   YAMADA_API_KEY="xxx" curl -fsSL ... | bash
# =====================================================

set -e

REPO="https://github.com/yuyaymd5846-cell/yamada-engei-works.git"
INSTALL_DIR="$HOME/.claude/mcp-servers/yamada-engei"
MCP_NAME="yamada-engei"
REPO_MCP_DIR="$HOME/.yamada-engei-tmp/mcp"

echo ""
echo "🌼 山田園芸ワークス MCP インストーラー"
echo "========================================"

# ── Node.js チェック ──
if ! command -v node &>/dev/null; then
  echo "❌ Node.js がインストールされていません。"
  echo "   https://nodejs.org からインストール後、再実行してください。"
  exit 1
fi
echo "✅ Node.js: $(node --version)"

# ── git チェック ──
if ! command -v git &>/dev/null; then
  echo "❌ git がインストールされていません。"
  exit 1
fi

# ── Claude Code チェック ──
if ! command -v claude &>/dev/null; then
  echo "❌ Claude Code がインストールされていません。"
  echo "   curl -fsSL https://claude.ai/install.sh | bash を実行してください。"
  exit 1
fi
echo "✅ Claude Code: $(claude --version 2>/dev/null | head -1)"

# ── リポジトリから mcp/ フォルダを取得 ──
echo ""
echo "📥 MCPサーバーのファイルをダウンロード中..."
rm -rf "$HOME/.yamada-engei-tmp"
git clone --depth=1 --filter=blob:none --sparse "$REPO" "$HOME/.yamada-engei-tmp" 2>/dev/null
cd "$HOME/.yamada-engei-tmp"
git sparse-checkout set mcp 2>/dev/null
echo "✅ ダウンロード完了"

# ── インストール先にコピー ──
mkdir -p "$INSTALL_DIR"
cp "$REPO_MCP_DIR/index.js"    "$INSTALL_DIR/index.js"
cp "$REPO_MCP_DIR/package.json" "$INSTALL_DIR/package.json"
cd "$INSTALL_DIR"

# ── npm install ──
echo ""
echo "📦 依存パッケージをインストール中..."
npm install --silent
echo "✅ インストール完了"

# ── APIキーの確認 ──
echo ""
if [ -n "$YAMADA_API_KEY" ]; then
  API_KEY="$YAMADA_API_KEY"
  echo "✅ APIキー: 環境変数から読み込みました"
else
  echo "🔑 APIキーを入力してください（Vercel管理画面の GPT_API_KEY の値）:"
  echo "   ※ 不明な場合は空のままEnterでもOK（後で変更可能）"
  read -r API_KEY
fi

# ── Claude Code に登録 ──
echo ""
echo "🔧 Claude Code に登録中..."

# 既存の登録を削除してから再登録
claude mcp remove "$MCP_NAME" 2>/dev/null || true

if [ -n "$API_KEY" ]; then
  claude mcp add "$MCP_NAME" \
    -e YAMADA_API_KEY="$API_KEY" \
    -- node "$INSTALL_DIR/index.js"
else
  claude mcp add "$MCP_NAME" \
    -- node "$INSTALL_DIR/index.js"
fi

# ── 後片付け ──
rm -rf "$HOME/.yamada-engei-tmp"

echo ""
echo "========================================"
echo "✅ インストール完了！"
echo ""
echo "次のステップ:"
echo "  1. Claude Code を再起動する"
echo "     → ターミナルで claude を実行するだけ"
echo "  2. 「今日のハウス状況は？」などと話しかけてみてください"
echo ""
echo "APIキーを後で変更したい場合:"
echo "  claude mcp remove yamada-engei"
echo "  claude mcp add yamada-engei -e YAMADA_API_KEY=\"新しいキー\" -- node $INSTALL_DIR/index.js"
echo "========================================"

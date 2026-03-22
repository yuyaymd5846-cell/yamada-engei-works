#!/usr/bin/env node
/**
 * yamada-engei MCP Server
 * yamada-engei-works (https://yamada-engei-works.vercel.app) と Claude を接続するMCPサーバー
 *
 * 環境変数:
 *   YAMADA_API_KEY  - APIキー（必須）
 *   YAMADA_API_URL  - APIのURL（省略時は本番URL）
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const API_URL = process.env.YAMADA_API_URL || "https://yamada-engei-works.vercel.app";
const API_KEY = process.env.YAMADA_API_KEY || "";

// --- API呼び出しヘルパー ---
async function callApi(path, options = {}) {
  const url = `${API_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

// --- MCPサーバー定義 ---
const server = new Server(
  { name: "yamada-engei", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// ツール一覧
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "get_greenhouse_status",
      description:
        "各ハウスの現在の状況を取得します。作付サイクル（品種・定植日・収穫予定日）、直近スケジュール（作業ステージ）、農薬ローテーションインデックスなどが含まれます。",
      inputSchema: {
        type: "object",
        properties: {},
        required: [],
      },
    },
    {
      name: "search_work_manuals",
      description:
        "スプレーマムの作業マニュアルを検索します。作業名・目的・ステージなどで検索可能。タイミング基準・手順・リスク・難易度・所要時間が取得できます。",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "検索キーワード（例：「摘芯」「農薬散布」「花芽分化」）。省略すると直近5件を返します。",
          },
        },
        required: [],
      },
    },
    {
      name: "get_work_analysis",
      description:
        "作業記録・作付サイクルの分析データを取得します。直近の作業実績（日付・作業名・ハウス名・所要時間・メモ）と直近の作付サイクルが含まれます。",
      inputSchema: {
        type: "object",
        properties: {
          greenhouseName: {
            type: "string",
            description:
              "絞り込むハウス名（例：「1号ハウス」）。省略すると全ハウスが対象になります。",
          },
        },
        required: [],
      },
    },
    {
      name: "get_today_recommendations",
      description:
        "本日の推奨作業と各ハウスの農薬ローテーション情報を取得します。有効なスケジュールから今日すべき作業ステージが確認できます。",
      inputSchema: {
        type: "object",
        properties: {},
        required: [],
      },
    },
    {
      name: "add_work_record",
      description:
        "作業記録を新規登録します。作業名・ハウス名・所要時間は必須です。",
      inputSchema: {
        type: "object",
        properties: {
          workName: {
            type: "string",
            description: "作業名（例：「摘芯」「農薬散布」「定植」）",
          },
          greenhouseName: {
            type: "string",
            description: "ハウス名（例：「1号ハウス」）",
          },
          spentTime: {
            type: "number",
            description: "所要時間（分）",
          },
          note: {
            type: "string",
            description: "作業メモ・特記事項（任意）",
          },
          workerName: {
            type: "string",
            description: "作業者名（任意、省略時は「Claude Assistant」）",
          },
        },
        required: ["workName", "greenhouseName", "spentTime"],
      },
    },
  ],
}));

// ツール実行
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "get_greenhouse_status": {
        const data = await callApi("/api/gpt/status");
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      }

      case "search_work_manuals": {
        const query = args?.query ? `?q=${encodeURIComponent(args.query)}` : "";
        const data = await callApi(`/api/gpt/manuals${query}`);
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      }

      case "get_work_analysis": {
        const ghParam = args?.greenhouseName
          ? `?greenhouseName=${encodeURIComponent(args.greenhouseName)}`
          : "";
        const data = await callApi(`/api/gpt/analysis${ghParam}`);
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      }

      case "get_today_recommendations": {
        const data = await callApi("/api/gpt/recommendations");
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      }

      case "add_work_record": {
        const { workName, greenhouseName, spentTime, note, workerName } = args;
        const data = await callApi("/api/gpt/work-records", {
          method: "POST",
          body: JSON.stringify({
            workName,
            greenhouseName,
            spentTime,
            note: note || null,
            workerName: workerName || "Claude Assistant",
          }),
        });
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (err) {
    return {
      content: [{ type: "text", text: `エラー: ${err.message}` }],
      isError: true,
    };
  }
});

// 起動
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("yamada-engei MCP server started");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

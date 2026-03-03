# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案概述

**AgentsGate** 是一個 AI Skill 與 Sub-Agent 的分享平台，讓開發者能上傳、審核、搜尋、安裝由社群建立的 Claude Code Skills 或 Sub-Agents（透過 MCP 架構整合）。

## 技術架構

### 全端架構

```
┌──────────────────────────────────────────────────────────────┐
│                        前端 (Next.js)                         │
│  - 瀏覽 / 搜尋 Skills & Agents                                │
│  - 上傳表單（含 MCP Server 規格填寫）                          │
│  - 審核管理後台                                                │
└────────────────────────┬─────────────────────────────────────┘
                         │ REST API / GraphQL
┌────────────────────────▼─────────────────────────────────────┐
│                     後端 API (FastAPI)                         │
│  - 上傳 / 審核 / 發布流程                                      │
│  - AI 初審 Service（Claude Sonnet）                            │
│  - 搜尋 Service（語義搜尋 + 關鍵字）                           │
│  - 版本管理 Service                                            │
└───────────┬─────────────────────────────┬────────────────────┘
            │                             │
┌───────────▼──────────┐    ┌─────────────▼──────────────────┐
│   PostgreSQL (主資料) │    │  MongoDB (向量搜尋 / Embedding) │
│  - 使用者資料         │    │  - Skill/Agent 描述向量         │
│  - Skill/Agent 元資料 │    │  - 語義搜尋索引                 │
│  - 審核紀錄           │    └────────────────────────────────┘
│  - 版本歷史           │
└──────────────────────┘
```

### 技術選型

| 層級 | 技術 |
|------|------|
| 前端 | Next.js (App Router) + TypeScript + Tailwind CSS |
| 後端 | FastAPI (Python) + Pydantic v2 |
| 主資料庫 | PostgreSQL |
| 向量資料庫 | MongoDB Atlas (語義搜尋) |
| AI 審核 | Claude Sonnet (Anthropic SDK) |
| 認證 | NextAuth.js (前端) + JWT (後端) |
| 容器化 | Docker + Docker Compose |

## 核心功能模組

### 1. Skill/Agent 上傳規範

每個上傳的 Skill 或 Agent 必須提供以下資訊：

| 欄位 | 說明 | 必填 |
|------|------|------|
| `name` | 名稱（唯一識別） | ✅ |
| `type` | 類型：`skill` 或 `agent` | ✅ |
| `description` | 功能描述（用途、解決什麼問題） | ✅ |
| `mcp_spec` | MCP Server 規格（工具名稱、輸入/輸出 schema） | ✅ |
| `usage_examples` | 使用範例（含呼叫方式與預期輸出） | ✅ |
| `dependencies` | 相依套件與環境需求 | ✅ |
| `tags` | 適用情境標籤（如 coding、security、data-analysis） | ✅ |
| `version` | 版本號（遵循 SemVer：x.y.z） | ✅ |
| `changelog` | 更新紀錄 | ✅（v1.0.0 起） |
| `author` | 作者資訊 | ✅ |
| `license` | 授權條款 | ✅ |

### 2. 審核流程

```
上傳 → AI 初審（Claude 自動檢查） → 人工複審 → 發布
  │            │                        │
  │     不符格式/安全疑慮              核准/退回
  │     ↓ 自動退回並提供說明
  └──── 修改後重新提交
```

**AI 初審檢查項目：**
- 必填欄位完整性
- MCP Server 規格格式正確性
- 描述文字品質（是否清楚說明功能）
- 安全性初步掃描（不得包含惡意指令或 prompt injection）
- 使用範例可讀性

### 3. MCP Server 規格格式

每個 Skill/Agent 的 MCP 規格需包含：

```json
{
  "mcp_spec": {
    "server_name": "my-skill-server",
    "version": "1.0.0",
    "tools": [
      {
        "name": "tool_name",
        "description": "工具功能說明",
        "input_schema": {
          "type": "object",
          "properties": {
            "param1": { "type": "string", "description": "參數說明" }
          },
          "required": ["param1"]
        }
      }
    ],
    "setup": {
      "command": "啟動指令",
      "args": [],
      "env": { "API_KEY": "your-api-key" }
    }
  }
}
```

## 專案目錄結構

```
AgentsGate/
├── frontend/               # Next.js 前端
│   ├── app/                # App Router 頁面
│   ├── components/         # 共用元件
│   └── lib/                # API client、工具函式
│
├── backend/                # FastAPI 後端
│   ├── app/
│   │   ├── api/            # API 路由 (v1/)
│   │   ├── models/         # SQLAlchemy 資料模型
│   │   ├── schemas/        # Pydantic 請求/回應 schema
│   │   ├── services/       # 業務邏輯（審核、搜尋、版本）
│   │   └── core/           # 設定、資料庫連線、認證
│   └── tests/
│
├── docker-compose.yml      # 本地開發環境
└── CLAUDE.md
```

## 開發指令

### 本地環境啟動

```bash
# 啟動所有服務（PostgreSQL、MongoDB、前後端）
docker-compose up -d

# 前端開發伺服器
cd frontend && npm run dev        # http://localhost:3000

# 後端開發伺服器
cd backend && uvicorn app.main:app --reload --port 8000
```

### 後端

```bash
cd backend

# 安裝相依套件
pip install -r requirements.txt

# 資料庫 migration
alembic upgrade head

# 執行測試
pytest                          # 所有測試
pytest tests/unit/              # 只跑單元測試
pytest tests/integration/       # 整合測試
pytest -k "test_upload"         # 執行特定測試

# 程式碼檢查
ruff check .
mypy app/
```

### 前端

```bash
cd frontend

npm install
npm run dev                     # 開發模式
npm run build                   # 正式建置
npm run lint                    # ESLint 檢查
npm run type-check              # TypeScript 型別檢查
npm test                        # Jest 單元測試
```

## 重要設計原則

### API 回應格式（統一 Envelope）

```python
{
  "success": bool,
  "data": dict | None,
  "error": str | None,
  "meta": {              # 分頁時附加
    "total": int,
    "page": int,
    "limit": int
  }
}
```

### 審核狀態流轉

```
DRAFT → PENDING_AI_REVIEW → PENDING_HUMAN_REVIEW → PUBLISHED
                                                  → REJECTED
```

### 版本管理

- 遵循 SemVer（x.y.z）
- 每次更新需填寫 changelog
- 舊版本保留供查閱，但只有最新版顯示在搜尋結果

## 環境變數

後端 `.env` 必要設定：

```
DATABASE_URL=postgresql://user:pass@localhost:5432/agentsgate
MONGODB_URI=mongodb://localhost:27017
ANTHROPIC_API_KEY=                 # Claude 審核用
JWT_SECRET_KEY=
```

前端 `.env.local` 必要設定：

```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
```

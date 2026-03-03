# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案概述

**AgentsGate** 是一個 AI Skill 與 Sub-Agent 的分享平台，核心價值主張：

> **上傳一次，適配所有 CLI，下載即用，零設定。**

開發者上傳 Skill 或 Agent 後，平台自動產生各 CLI 的適配檔案。使用者下載後執行安裝腳本，直接在自己慣用的 CLI 工具中使用，不需要任何額外設定。

## 支援的 CLI 工具

| CLI | 技能目錄（專案層級） | 技能目錄（使用者全域） | MCP 設定檔 |
|-----|---------------------|----------------------|-----------|
| Claude Code | `.claude/skills/{name}/SKILL.md` | `~/.claude/skills/{name}/SKILL.md` | `.claude/settings.local.json` |
| GitHub Copilot | `.github/agents/{name}.agent.md` | `~/.copilot/agents/` | `.copilot/mcp-config.json` |
| Gemini CLI | `.gemini/skills/{name}/SKILL.md` | `~/.gemini/skills/{name}/SKILL.md` | 不支援獨立 MCP 設定 |
| Kiro CLI | `.kiro/steering/{name}.md` | `~/.kiro/settings/` | `.kiro/settings/mcp.json` |

### Windows 路徑對照

| CLI | Windows 使用者全域路徑 |
|-----|----------------------|
| Claude Code | `%APPDATA%\Claude\skills\` |
| GitHub Copilot | `%APPDATA%\GitHub Copilot\agents\` |
| Gemini CLI | `%APPDATA%\Gemini CLI\skills\` |
| Kiro CLI | `%APPDATA%\Kiro\settings\` |

## 下載套件結構

使用者下載的套件包含各 CLI 的適配檔案與安裝腳本：

```
{skill-name}-package/
├── claude/
│   ├── SKILL.md                  # Claude Code 格式
│   └── mcp-config.json           # MCP server 設定（若適用）
├── copilot/
│   └── {skill-name}.agent.md     # GitHub Copilot 格式
├── gemini/
│   └── SKILL.md                  # Gemini CLI 格式
├── kiro/
│   ├── {skill-name}.md           # Kiro steering 格式
│   └── mcp-config.json           # Kiro MCP 設定（若適用）
├── install.ps1                   # Windows 安裝腳本（主要）
└── install.sh                    # Mac 安裝腳本（次要）
```

安裝腳本自動偵測 OS，將檔案複製到正確路徑並設定 MCP server。

## 各 CLI 檔案格式規範

### Claude Code（SKILL.md）

```yaml
---
name: skill-name
description: 功能說明，描述何時使用此 Skill（1024 字元以內）
user-invocable: true
---
# Skill 內容
```

### GitHub Copilot（.agent.md）

```yaml
---
name: Skill Name
description: 功能說明
tools: ["tool1", "tool2"]
---
# Agent 內容
```

### Gemini CLI（SKILL.md）

```yaml
---
name: skill-name
description: 功能說明（Gemini 依此決定何時呼叫，最關鍵欄位）
---
# Skill 內容
```

### Kiro CLI（steering .md）

```yaml
---
inclusion: always
---
# Steering 內容
```

### MCP Server 設定（Claude Code / Kiro 共用格式）

```json
{
  "mcpServers": {
    "server-name": {
      "type": "stdio",
      "command": "npx",
      "args": ["@org/mcp-server"],
      "env": { "API_KEY": "${API_KEY}" }
    }
  }
}
```

## 技術架構

### 全端架構

```
┌──────────────────────────────────────────────────────────────┐
│                        前端 (Next.js)                         │
│  - 瀏覽 / 搜尋 Skills & Agents                                │
│  - 上傳表單（含各 CLI 適配設定）                               │
│  - 下載套件（含安裝腳本）                                      │
│  - 審核管理後台                                                │
└────────────────────────┬─────────────────────────────────────┘
                         │ REST API
┌────────────────────────▼─────────────────────────────────────┐
│                  後端 API (Spring Boot)                        │
│  - 上傳 / 審核 / 發布流程                                      │
│  - CLI 適配檔案產生 Service（各 CLI 格式轉換）                  │
│  - 下載套件封裝 Service（含安裝腳本產生）                       │
│  - AI 初審 Service（LangChain4j + Claude Sonnet）              │
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
│  - CLI 適配檔案       │
└──────────────────────┘
```

### 技術選型

| 層級 | 技術 |
|------|------|
| 前端 | Next.js (App Router) + TypeScript + Tailwind CSS |
| 後端 | Java 21 + Spring Boot 3.x |
| AI REST 整合 | Spring AI（REST 端點、基礎 Claude 模型呼叫） |
| AI Agent 編排 | LangChain4j（審核流程、複雜任務編排、RAG） |
| 主資料庫 | PostgreSQL |
| 向量資料庫 | MongoDB（語義搜尋） |
| ORM | Spring Data JPA (Hibernate) |
| 認證 | NextAuth.js（前端）+ Spring Security + JWT（後端） |
| 容器化 | Docker + Docker Compose |
| 建置工具 | Maven |

## 核心功能模組

### 1. Skill/Agent 上傳規範

每個上傳的 Skill 或 Agent 必須提供以下資訊：

| 欄位 | 說明 | 必填 |
|------|------|------|
| `name` | 名稱（唯一識別，lowercase + hyphen） | ✅ |
| `type` | 類型：`skill` 或 `agent` | ✅ |
| `description` | 功能描述（用途、解決什麼問題） | ✅ |
| `content` | Skill/Agent 的核心指令內容（通用版） | ✅ |
| `mcp_spec` | MCP Server 規格（若需要外部工具） | 選填 |
| `usage_examples` | 使用範例（含呼叫方式與預期輸出） | ✅ |
| `dependencies` | 相依套件與環境需求 | ✅ |
| `tags` | 適用情境標籤（如 coding、security） | ✅ |
| `version` | 版本號（SemVer：x.y.z） | ✅ |
| `changelog` | 更新紀錄 | ✅（v1.0.0 起） |
| `cli_overrides` | 各 CLI 的客製化描述（選填覆蓋通用描述） | 選填 |
| `os_compatibility` | 支援的 OS（windows / macos） | ✅ |
| `author` | 作者資訊 | ✅ |
| `license` | 授權條款 | ✅ |

### 2. 審核流程

```
上傳 → AI 初審（LangChain4j + Claude）→ 人工複審 → 發布
  │              │                           │
  │      不符格式 / 安全疑慮              核准 / 退回
  │      ↓ 自動退回並提供說明
  └──── 修改後重新提交
```

**AI 初審檢查項目：**
- 必填欄位完整性
- 各 CLI 適配描述品質
- 安全性掃描（不得包含惡意指令或 prompt injection）
- MCP Server 規格格式正確性（若有）
- 使用範例可讀性

### 3. 審核狀態流轉

```
DRAFT → PENDING_AI_REVIEW → PENDING_HUMAN_REVIEW → PUBLISHED
                                                  → REJECTED
```

### 4. CLI 相容性規則

- 若 Skill/Agent 的 `mcp_spec` 有值（需要 MCP Server），自動標記為**不支援 Gemini CLI**
- 平台在 Skill 詳細頁顯示各 CLI 的相容狀態標籤
- 下載時只提供使用者所選 CLI 的適配套件

```
mcp_spec 有值 → Gemini CLI: ❌ 不支援
mcp_spec 為空 → 全 CLI 相容 ✅
```

### 5. 版本管理

- 遵循 SemVer（x.y.z）
- 每次更新需填寫 changelog
- 舊版本保留供查閱，搜尋結果只顯示最新版

## 專案目錄結構

```
AgentsGate/
├── frontend/                        # Next.js 前端
│   ├── app/                         # App Router 頁面
│   ├── components/                  # 共用元件
│   └── lib/                         # API client、工具函式
│
├── backend/                         # Java 21 + Spring Boot 後端
│   ├── src/main/java/com/agentsgate/
│   │   ├── api/                     # REST Controller 層
│   │   ├── domain/                  # Entity（JPA 資料模型）
│   │   ├── dto/                     # 請求 / 回應 DTO
│   │   ├── repository/              # Spring Data JPA Repository
│   │   ├── service/
│   │   │   ├── adapter/             # CLI 適配檔案產生（各 CLI 格式轉換）
│   │   │   ├── packaging/           # 下載套件封裝（含安裝腳本產生）
│   │   │   ├── review/              # LangChain4j AI 審核 Service
│   │   │   ├── search/              # 語義搜尋 Service
│   │   │   └── version/             # 版本管理 Service
│   │   ├── ai/                      # Spring AI + LangChain4j 設定與整合
│   │   └── config/                  # Spring Security、DB、CORS 設定
│   ├── src/main/resources/
│   │   └── application.yml
│   ├── src/test/
│   └── pom.xml
│
├── docker-compose.yml
└── CLAUDE.md
```

## 開發指令

### 本地環境啟動

```bash
# 啟動基礎服務（PostgreSQL、MongoDB）
docker-compose up -d

# 前端
cd frontend && npm run dev        # http://localhost:3000

# 後端
cd backend && ./mvnw spring-boot:run   # http://localhost:8080
```

### 後端（Java 21 + Spring Boot）

```bash
cd backend

./mvnw compile
./mvnw test
./mvnw test -Dtest=SkillServiceTest   # 執行單一測試類別
./mvnw verify -P integration-test     # 整合測試
./mvnw package -DskipTests
./mvnw checkstyle:check
```

### 前端

```bash
cd frontend

npm install
npm run dev
npm run build
npm run lint
npm run type-check
npm test
```

## API 回應格式（統一 Envelope）

```json
{
  "success": true,
  "data": {},
  "error": null,
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

## 環境變數

後端 `application.yml`：

```yaml
spring:
  datasource:
    url: ${DB_URL}
    username: ${DB_USER}
    password: ${DB_PASSWORD}
  data:
    mongodb:
      uri: ${MONGODB_URI}
  ai:
    anthropic:
      api-key: ${ANTHROPIC_API_KEY}
      chat:
        options:
          model: claude-sonnet-4-6

langchain4j:
  anthropic:
    api-key: ${ANTHROPIC_API_KEY}

app:
  jwt:
    secret: ${JWT_SECRET_KEY}
    expiration-ms: 86400000
```

前端 `.env.local`：

```
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
```

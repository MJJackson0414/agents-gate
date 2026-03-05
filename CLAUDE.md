# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案概述

**AgentsGate** 是一個 AI Skill 與 Sub-Agent 的分享平台，核心價值主張：

> **上傳一次，適配所有 CLI，下載即用，零設定。**

開發者上傳 Skill 或 Agent 後，平台自動產生各 CLI 的適配檔案。使用者下載後執行安裝腳本，直接在自己慣用的 CLI 工具中使用，不需要任何額外設定。

## 實作進度

| 功能模組 | 狀態 | 說明 |
|----------|------|------|
| 上傳精靈（4 步驟） | ✅ P0 完成 | 前端完整 Wizard 流程 |
| Skill/Agent 類型選擇 | ✅ P0 完成 | TypeDecisionCard |
| 後端上傳 API | ✅ P0 完成 | `POST /api/v1/skills` |
| 首頁瀏覽 + 搜尋 + 分頁 | ✅ P0 完成 | SkillExplorer |
| 範例資料 Seed | ✅ P0 完成 | 54 個 BMAD Skills |
| CLI 適配檔案預覽 | ✅ P0 完成 | 前端產生（客戶端）|
| 變數 & 附加檔案（上傳精靈） | ✅ P1 完成 | Step2 自動偵測 `{VAR}` / `$VAR`，附加腳本 |
| AI 初審（LangChain4j） | ✅ P1 完成 | 非同步審核，Claude Sonnet 4.6，JSON 解析防護 |
| 人工審核後台 | ⬜ P1 | 管理員 UI，審核 PENDING_HUMAN_REVIEW 清單 |
| CLI 下載套件封裝 | ⬜ P1 | 後端 packaging service |
| MongoDB 語義搜尋 | ⬜ P2 | Embedding + RAG |
| 使用者認證（JWT） | ⬜ P2 | NextAuth + Spring Security |
| 版本歷史 | ⬜ P2 | SemVer 管理 |

---

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

---

## 下載套件結構（P1 計劃）

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
├── install.ps1                   # Windows 安裝腳本
└── install.sh                    # macOS 安裝腳本
```

---

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

---

## 技術架構

### 全端架構

```
┌──────────────────────────────────────────────────────────────┐
│                        前端 (Next.js)                         │
│  ✅ 瀏覽 / 搜尋 / 篩選 Skills & Agents（首頁 SkillExplorer） │
│  ✅ 上傳精靈（TypeDecisionCard + 4 步驟 Wizard）              │
│  ✅ CLI 適配預覽（客戶端產生，Step 4）                         │
│  ⬜ 下載套件（P1）                                             │
│  ⬜ 審核管理後台（P1）                                         │
└────────────────────────┬─────────────────────────────────────┘
                         │ REST API
┌────────────────────────▼─────────────────────────────────────┐
│                  後端 API (Spring Boot)                        │
│  ✅ GET  /api/v1/skills   — 列出所有 Skill/Agent              │
│  ✅ POST /api/v1/skills   — 上傳 Skill/Agent                  │
│  ✅ DataSeeder（啟動時 seed 54 個 BMAD 範例）                  │
│  ⬜ CLI 適配 Service（P1）                                     │
│  ⬜ AI 初審 Service（LangChain4j + Claude，P1）                │
│  ⬜ 下載套件封裝 Service（P1）                                 │
│  ⬜ 搜尋 Service（P2）                                         │
└───────────┬─────────────────────────────┬────────────────────┘
            │                             │
┌───────────▼──────────┐    ┌─────────────▼──────────────────┐
│   PostgreSQL (主資料) │    │  MongoDB（P2：向量搜尋）         │
│  ✅ skills 資料表     │    │  ⬜ Skill 描述向量 Embedding    │
│  ✅ JSONB 欄位        │    │  ⬜ 語義搜尋索引                │
└──────────────────────┘    └────────────────────────────────┘
```

### 技術選型（目前已實作）

| 層級 | 技術 | 版本 |
|------|------|------|
| 前端框架 | Next.js App Router + TypeScript | 16.1.6 |
| UI | Tailwind CSS v4 + lucide-react + clsx | 最新版 |
| 後端框架 | Java 21 + Spring Boot | 3.4.3 |
| ORM | Spring Data JPA (Hibernate) | 6.6.x |
| 驗證 | Spring Boot Validation (Jakarta Bean) | — |
| 安全 | Spring Security（目前全開放，P2 再加 JWT） | — |
| 主資料庫 | PostgreSQL | 16 |
| 容器化 | Docker + Docker Compose | — |
| 建置工具 | Maven | 3.9.7 |

### 技術選型（P1/P2 規劃）

| 功能 | 技術 |
|------|------|
| AI 審核 | LangChain4j + Claude Sonnet 4.6 |
| 認證 | NextAuth.js（前端）+ Spring Security JWT（後端） |
| 語義搜尋 | MongoDB + Embedding |

---

## 核心功能模組

### 1. Skill/Agent 上傳欄位規範（已實作）

| 欄位 | 說明 | 必填 | 驗證規則 |
|------|------|------|----------|
| `name` | 名稱（唯一識別） | ✅ | lowercase + hyphen，max 64 chars |
| `type` | 類型：`SKILL` 或 `AGENT` | ✅ | Enum |
| `description` | 功能描述 | ✅ | max 1024 chars |
| `content` | 核心指令內容（通用版） | ✅ | NotBlank |
| `installationSteps` | 安裝步驟（路徑、環境需求） | ✅ | 至少 1 筆 |
| `dependencies` | 相依套件（node、git 等） | 選填 | — |
| `tags` | 情境標籤 | ✅ | 1-5 個 |
| `version` | 版本號 | ✅ | SemVer（x.y.z） |
| `changelog` | 更新紀錄 | ✅ | NotBlank |
| `osCompatibility` | 支援 OS | ✅ | WINDOWS / MACOS |
| `authorName` | 作者姓名 | ✅ | NotBlank |
| `authorEmail` | 作者信箱 | ✅ | 有效 Email 格式 |
| `environmentDeclaration` | 環境需求宣告（巢狀物件） | ✅ | 見下方 |
| `mcpSpec` | MCP Server 規格 | 選填 | 見下方 |
| `cliOverrides` | 各 CLI 客製化描述 | 選填 | Map<String, String> |
| `variables` | 使用者可配置參數（名稱、說明、範例值） | 選填 | `{VAR_NAME}` / `$VAR_NAME` 自動偵測 |
| `attachedFiles` | 附加腳本或設定檔（檔名 + 內容） | 選填 | 不進行 AI 安全審查，由提交者自負 |

#### environmentDeclaration 欄位

| 欄位 | 說明 | 型別 |
|------|------|------|
| `requiresInternet` | 需要網路連線 | boolean |
| `requiresMcpServer` | 需要 MCP Server | boolean |
| `requiresLocalService` | 需要本地服務（DB、Docker） | boolean |
| `requiresSystemPackages` | 需要系統套件 | boolean |
| `additionalNotes` | 補充說明（選填） | String |

#### mcpSpec 欄位（選填）

| 欄位 | 說明 | 必填 |
|------|------|------|
| `serverName` | MCP Server 名稱 | ✅ |
| `command` | 啟動指令（如 `npx`） | ✅ |
| `args` | 指令參數 | 選填 |
| `env` | 環境變數 Map | 選填 |

### 2. CLI 相容性規則

```
mcpSpec 有值 → hasMcpSpec = true → Gemini CLI: ❌ 不支援
mcpSpec 為空 → hasMcpSpec = false → 全 CLI 相容 ✅
```

前端 `cli-adapter.ts` 在 Step 4 預覽時自動套用此規則。

### 3. 審核狀態流轉

```
DRAFT → PENDING_AI_REVIEW → PENDING_HUMAN_REVIEW → PUBLISHED
                          → REJECTED（AI 不核准）
```

- 上傳後立即觸發 `AiReviewService.reviewAsync()`（Spring `@Async`）
- AI 審核由 `SkillReviewAiService`（LangChain4j interface）呼叫 Claude Sonnet 4.6
- AI 核准 → `PENDING_HUMAN_REVIEW`；AI 拒絕 → `REJECTED`
- 審核結果以 JSON 存入 `reviewFeedback` 欄位（`SkillReviewResult` 結構）
- **下一步**：人工審核後台，管理員可將 `PENDING_HUMAN_REVIEW` → `PUBLISHED` 或 `REJECTED`

### 4. 首頁可見性規則

`GET /api/v1/skills` 以 `findByStatusNotIn(DRAFT, REJECTED)` 過濾，只回傳：

| 狀態 | 首頁顯示 | 說明 |
|------|----------|------|
| `PUBLISHED` | ✅ | 完整顯示，可下載 |
| `PENDING_AI_REVIEW` | ✅ | 顯示但無下載入口 |
| `PENDING_HUMAN_REVIEW` | ✅ | 顯示但無下載入口 |
| `DRAFT` | ❌ | 不顯示 |
| `REJECTED` | ❌ | 不顯示 |

### 5. 首頁搜尋邏輯（客戶端）

`SkillExplorer` 元件在客戶端執行搜尋與分頁：

- **搜尋範圍**：`name`、`description`、`tags`（includes 模糊比對）
- **類型篩選**：全部 / Skill / Agent
- **每頁筆數**：30 筆
- 搜尋或切換類型時自動重置為第一頁
- `fetchSkills()` 設定 `cache: 'no-store'`，首頁永遠取得即時資料

---

## 專案目錄結構（實際現況）

```
AgentsGate/
├── frontend/                              # Next.js 16 前端
│   ├── app/
│   │   ├── layout.tsx                     # 根 Layout
│   │   ├── globals.css                    # 全域樣式
│   │   ├── page.tsx                       # 首頁（Server Component，抓資料後傳給 SkillExplorer）
│   │   ├── upload/
│   │   │   ├── page.tsx                   # 類型選擇頁（TypeDecisionCard）
│   │   │   └── [type]/
│   │   │       └── page.tsx               # 精靈路由（?step=1~4）
│   ├── components/
│   │   ├── SkillExplorer.tsx              # 首頁：搜尋 / 篩選 / 分頁 / SkillCard
│   │   └── upload/
│   │       ├── TypeDecisionCard.tsx       # Skill vs Agent 選擇卡
│   │       ├── WizardLayout.tsx           # 步驟進度條
│   │       ├── WizardStep1Basic.tsx       # 步驟 1：基本資訊
│   │       ├── WizardStep2Content.tsx     # 步驟 2：內容 + 安裝步驟
│   │       ├── WizardStep3Environment.tsx # 步驟 3：環境宣告
│   │       └── WizardStep4Preview.tsx     # 步驟 4：預覽 + 提交
│   ├── lib/
│   │   ├── api.ts                         # fetchSkills() / uploadSkill()
│   │   ├── cli-adapter.ts                 # 客戶端 CLI 適配檔案產生器
│   │   └── upload-context.tsx             # useReducer 狀態 + localStorage 草稿
│   ├── .env.local                         # 環境變數（本地）
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   └── package.json
│
├── backend/                               # Java 21 + Spring Boot 3.4.3
│   ├── src/main/java/com/agentsgate/
│   │   ├── AgentsGateApplication.java     # Spring Boot 入口
│   │   ├── api/
│   │   │   └── SkillController.java       # GET + POST /api/v1/skills
│   │   ├── domain/
│   │   │   ├── Skill.java                 # JPA Entity（含巢狀 record）
│   │   │   ├── SkillType.java             # Enum: SKILL, AGENT
│   │   │   ├── SkillStatus.java           # Enum: DRAFT...PUBLISHED
│   │   │   └── OsType.java                # Enum: WINDOWS, MACOS
│   │   ├── dto/
│   │   │   ├── SkillUploadRequest.java    # 上傳 DTO（含驗證）
│   │   │   ├── SkillResponse.java         # 回應 DTO
│   │   │   └── ApiResponse.java           # 統一 Envelope
│   │   ├── repository/
│   │   │   └── SkillRepository.java       # JpaRepository<Skill, UUID>
│   │   ├── service/
│   │   │   └── SkillService.java          # uploadSkill() / listAll()
│   │   ├── ai/
│   │   │   ├── AiReviewService.java       # @Async 審核協調器（觸發、狀態流轉、錯誤處理）
│   │   │   ├── SkillReviewAiService.java  # LangChain4j interface（@SystemMessage / @UserMessage）
│   │   │   └── SkillReviewResult.java     # 審核結果 record（approved, summary, issues...）
│   │   └── config/
│   │       ├── SecurityConfig.java        # CORS 設定，目前全開放
│   │       └── DataSeeder.java            # 啟動時 seed 54 個 BMAD Skills
│   ├── src/main/resources/
│   │   └── application.yml
│   ├── .mvn/
│   │   ├── jvm.config                     # JVM UTF-8 旗標
│   │   └── wrapper/maven-wrapper.properties
│   ├── mvnw.cmd                           # Windows Maven Wrapper（含 chcp 65001）
│   └── pom.xml
│
├── docker-compose.yml                     # PostgreSQL 16 + MongoDB 7
└── CLAUDE.md
```

---

## 開發指令

### 本地環境啟動

```bash
# 1. 啟動資料庫（PostgreSQL + MongoDB）
docker-compose up -d

# 2. 後端（Windows）
cd backend
.\mvnw.cmd spring-boot:run        # http://localhost:8080
# DataSeeder 會自動 seed 54 個範例技能（首次啟動 DB 空白時）

# 3. 前端
cd frontend
npm install                       # 首次安裝
npm run dev                       # http://localhost:3000
```

> **注意：** `mvnw.cmd` 已內建 `chcp 65001` 與 `MAVEN_OPTS=-Dfile.encoding=UTF-8`，中文 log 可正常顯示。

### 後端常用指令（Windows）

```bash
cd backend

.\mvnw.cmd compile
.\mvnw.cmd test
.\mvnw.cmd test -Dtest=SkillServiceTest
.\mvnw.cmd package -DskipTests
```

### 前端常用指令

```bash
cd frontend

npm run dev        # 開發模式
npm run build      # 生產建置（驗證 TypeScript）
npm run lint       # ESLint 檢查
```

---

## API 端點（目前實作）

### GET /api/v1/skills

回傳所有 Skill/Agent 清單。

**回應範例：**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "commit",
      "type": "SKILL",
      "description": "自動產生 conventional commit message",
      "status": "PUBLISHED",
      "version": "1.0.0",
      "tags": ["git", "coding"],
      "hasMcpSpec": false,
      "createdAt": "2026-03-04T10:00:00"
    }
  ],
  "error": null
}
```

### POST /api/v1/skills

上傳新的 Skill 或 Agent。

**請求 Body（JSON）：** 見上方「上傳欄位規範」。

**成功回應（201）：**
```json
{
  "success": true,
  "data": { "id": "uuid", "status": "DRAFT", ... },
  "error": null
}
```

**驗證失敗（400）：**
```json
{
  "success": false,
  "data": null,
  "error": "Validation failed",
  "meta": {
    "fieldErrors": {
      "name": "名稱只能使用小寫字母、數字和連字號",
      "version": "版本號需符合 SemVer 格式（如 1.0.0）"
    }
  }
}
```

---

## 環境變數

### 後端 `application.yml`（目前實際設定）

```yaml
spring:
  datasource:
    url: ${DB_URL:jdbc:postgresql://localhost:5432/agentsgate?characterEncoding=UTF-8&useUnicode=true}
    username: ${DB_USER:agentsgate}
    password: ${DB_PASSWORD:agentsgate}
    driver-class-name: org.postgresql.Driver
    hikari:
      connection-init-sql: "SET client_encoding TO 'UTF8'"
  jpa:
    hibernate:
      ddl-auto: update           # 保留資料，僅自動 ALTER 新增欄位
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect

server:
  port: 8080
  servlet:
    encoding:
      charset: UTF-8
      enabled: true
      force: true

app:
  cors:
    allowed-origins: ${CORS_ORIGINS:http://localhost:3000}
```

> **開發注意：** `ddl-auto: update` 重啟後保留資料，Hibernate 自動 ALTER 新增欄位。DataSeeder 有 `count == 0` 保護，不會重複 seed。生產環境建議改為 `validate` 並使用 Flyway 管理 Schema。

### 前端 `.env.local`

```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

---

## 重要實作細節

### UTF-8 支援（Windows）

專案在 Windows 上需特別處理 UTF-8 編碼：

- `backend/.mvn/jvm.config` — Maven JVM 加入 `-Dfile.encoding=UTF-8 -Dstdout.encoding=UTF-8`
- `backend/mvnw.cmd` — 執行前自動 `chcp 65001`（終端機切換為 UTF-8）
- `backend/pom.xml` — `project.build.sourceEncoding=UTF-8`
- `application.yml` — `server.servlet.encoding.force=true`、JDBC `client_encoding=UTF8`
- `docker-compose.yml` — PostgreSQL `POSTGRES_INITDB_ARGS: "--encoding=UTF8"`

### CLI 適配器（客戶端，`lib/cli-adapter.ts`）

Step 4 預覽時，前端直接產生各 CLI 格式的適配檔案內容（不需後端），規則：

| CLI | 格式 | MCP 限制 |
|-----|------|----------|
| Claude Code | `SKILL.md`（YAML frontmatter） | 無 |
| GitHub Copilot | `.agent.md`（YAML frontmatter） | 無 |
| Gemini CLI | `SKILL.md` | 若有 mcpSpec 則標記不支援 |
| Kiro | `.md`（inclusion: manual） | 若有 mcpSpec 則標記不支援 |

### DataSeeder（`config/DataSeeder.java`）

Spring Boot 啟動時若 `skills` 資料表為空，自動 seed 54 個 BMAD 框架 Skills（狀態為 `PUBLISHED`）。

---

## 常見問題

**Q: 後端啟動後 log 顯示亂碼？**
A: 確認使用 `.\mvnw.cmd` 執行（非直接呼叫 `mvn`），它會自動設定 UTF-8 終端機與 JVM 編碼。

**Q: 首頁資料為空？**
A: 確認 PostgreSQL 正在執行（`docker-compose up -d`）且後端已啟動（DataSeeder 會自動執行）。

**Q: 前端上傳後看不到新資料？**
A: 確認 Skill 狀態不是 `DRAFT` 或 `REJECTED`（首頁只顯示 PUBLISHED / PENDING_AI_REVIEW / PENDING_HUMAN_REVIEW）。若剛上傳 AI 審核尚未完成，稍等幾秒再重新整理。

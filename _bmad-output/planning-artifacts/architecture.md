---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - "/Users/linyungyuan/Desktop/workspace/agents-gate/CLAUDE.md"
  - "/Users/linyungyuan/Desktop/workspace/agents-gate/GEMINI.md"
  - "/Users/linyungyuan/Desktop/workspace/agents-gate/project_analysis.md"
workflowType: 'architecture'
project_name: 'AgentsGate'
user_name: 'Jackson'
date: '2026-03-03T21:43:53+08:00'
lastStep: 8
status: 'complete'
completedAt: '2026-03-03T22:17:10+08:00'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Starter Template Evaluation

### Primary Technology Domain

全端 (Web 前端 + AI 整合後端 API) based on project requirements analysis.

### Starter Options Considered

因為您的系統分為獨立的前端與後端兩大部分，我們為這兩個部分分別選擇 Starter，以便能保持鬆耦合與各自的最佳實踐。

#### 前端 (Next.js)
對於 Next.js 的前端，官方推薦的 `create-next-app` 是最穩定且標準的初始化方式。

#### 後端 (Spring Boot)
對於 Spring Boot + AI (Langchain4j) + DB 的整合，使用 Spring Initializr 是建立基礎建設的最有效方式。

### Selected Starter: Next.js + Spring Boot 初始化工具

**Rationale for Selection:**
這兩個都是業界標準的官方初始化工具。它們提供了最穩定、相容性最高的套件配置，並且能確保專案架構符合最新的開發規範（例如 Next.js App Router 與 Spring Boot 3.x）。

**Initialization Command:**

前端 (Next.js 16/15+ App Router):
```bash
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

後端 (Spring Boot 3.4/3.5+):
使用 Spring Initializr (Web UI 或 curl) 包含以下主要 dependencies:
- Web: Spring Web
- Data: Spring Data JPA, PostgreSQL Driver, Spring Data MongoDB
- Security: Spring Security
- AI: Spring AI (或手動套用 langchain4j-spring-boot-starter)
- Tooling: Lombok

```bash
curl https://start.spring.io/starter.zip -d dependencies=web,data-jpa,postgresql,data-mongodb,security,lombok -d type=maven-project -d bootVersion=3.4.0 -d language=java -d baseDir=backend -d groupId=com.agentsgate -d artifactId=backend -o backend.zip
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
- 前端：TypeScript 5.x, Node.js 原生環境
- 後端：Java 21

**Styling Solution:**
- 前端：包含 Tailwind CSS 與 PostCSS 配置

**Build Tooling:**
- 前端：Next.js 內建的 Rust-based 編譯器 (SWC + Turbopack)
- 後端：Maven

**Testing Framework:**
*(Starter 未內建完整層級的測試，將在下一步驟中決策)*

**Code Organization:**
- 前端：`/src/app` 路由約定式目錄
- 後端：Maven 標準目錄 `src/main/java` 及 `src/main/resources`

**Development Experience:**
- 前端：Hot Module Replacement (HMR)、ESLint 預設規則
- 後端：Spring Boot DevTools (可選)



## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
- **Skill/Agent 上傳與管理**：支援填寫中繼資料（名稱、描述、版本、標籤等），並可覆寫各 CLI 客製化設定與 MCP Server 規格。
- **AI 審核與管理後台**：自動化的 AI 初審流程（包含格式、品質與安全性檢查），並結合人工複審。
- **CLI 相容性標記**：依據上傳內容動態標記各 CLI 的支援狀態（例如包含 MCP Server 規格的將不支援 Gemini CLI）。
- **多平台安裝套件封裝**：根據使用者的需要自動將檔案打包並提供適用於多平台（Windows / Mac）的安裝腳本。
- **搜尋功能**：支持基於自然語言的語義搜尋與關鍵字搜尋，以發現並採用別人分享的 AI Agent / Skill。
- **版本控制**：針對發布項目的版本歷程進行控管。

**Non-Functional Requirements:**
- **安全性 (Security)**：阻擋惡意指令、避免 prompt injection，保護平台與使用者的執行環境安全。
- **相容性 (Compatibility)**：必須順暢提供 4 種 CLI 工具 (Claude Code, GitHub Copilot, Gemini CLI, Kiro CLI) 的特定目錄結構與檔案格式，且兼容不同作業系統。
- **效能與搜尋體驗 (Performance & UX)**：搜尋引擎須支援高效的向量比對檢索體驗。

**Scale & Complexity:**
- 專案複雜度：中高 (Medium-High)
- 由於涉及動態檔案生成、語義搜尋、MCP 協議相容性與 LangChain4j AI 工作流編排，專案具有一定的整合挑戰。
- 估計核心架構單元：5-7 個（前端應用、核心 REST 服務、CLI 適配轉換器、安裝套件封裝器、審核狀態機、語義搜尋引擎）。

- Primary domain: 全端 (Web 前端 + AI 整合後端 API)
- Complexity level: Medium-High
- Estimated architectural components: 5-7 主要服務模組

### Technical Constraints & Dependencies

- BMad Method 規範：必須遵循現有的 BMad 工作流、目錄架構 (如 `_bmad/`) 進行設計。
- 多 CLI 模型支援差異：Gemini CLI 在架構設計上不支援獨立的 MCP Server 設定，必須在產生安裝套件與平台介面標示時被清楚隔離。
- 多重資料存儲架構：需同時維護關聯式資料（PostgreSQL）的 ACID 特性，以及非關聯式/向量資料（MongoDB）的語義檢索同步。
- 需介接 LLM (Claude)：審核流程高度依賴外部 LLM 的推論穩定度，需考慮 API 的 Rate Limit 與 Timeout 處理。

### Cross-Cutting Concerns Identified

- **跨服務安全性與權限**：從前端到後端需有一致的 NextAuth + Spring Security (JWT) 認證/授權機制。
- **工作狀態流轉與審核紀錄**：對於 Skill 的審核狀態變更需要有統一的 Audit Log 與 Traceability。
- **資料同步機制**：PostgreSQL 中的主要中繼資料變更時，必須同步更新 MongoDB 的向量索引（Eventual Consistency / Transactional Outbox 模式）。
- **AI 防護與信任（Trust & Safety）**：必須在系統的不同層級實作內容過濾與 Prompt Injection 防護網。

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- **資料庫與搜尋引擎同步架構**: Outbox Pattern (PostgreSQL + MongoDB)
- **跨服務身份驗證機制**: 無狀態 JWT (JSON Web Token)

**Important Decisions (Shape Architecture):**
- **API 介面標準**: RESTful API + Swagger/OpenAPI
- **前端狀態管理**: TanStack Query (Server State) + Zustand (Client State)

**Deferred Decisions (Post-MVP):**
- 大規模叢集部署的快取系統 (如 Redis Cluster)

### Data Architecture

- **資料同步策略**: Outbox Pattern
  - **版本**: Spring Data JPA/MongoDB (Spring Boot 3.4.x / 3.5.x LTS)
  - **Rationale**: 針對 PostgreSQL 至 MongoDB 向量庫的同步，Outbox 模式能保證最終一致性 (Eventual Consistency) 且不需引入額外 Message Broker (如 Kafka)，適合目前的中大型應用複雜度。
  - **Affects**: Skill/Agent 資料發布流程、非同步作業機制。

### Authentication & Security

- **認證機制**: 無狀態 JWT (Stateless JWT)
  - **版本**: 近期穩定版的 NextAuth.js (v4 或 v5) + Spring Security (Spring Boot 3.4.x / 3.5.x)
  - **Rationale**: 作為一個前後端分離的平台，採用 JWT 能降低後端管理 Session 的資源耗用與擴張性挑戰。
  - **Affects**: 所有需要登入或授權的端點及使用者狀態管理。

### API & Communication Patterns

- **API 設計標準**: RESTful API 加上自動化 OpenAPI 規範
  - **版本**: springdoc-openapi v2.x (支援 Spring Boot 3)
  - **Rationale**: 對於資源導向（上傳、下載、查詢 Skill/Agent）非常直覺，且 OpenAPI 可以為前端或第三方開發者提供精確的型別定義檔，加速開發。
  - **Affects**: 後端 Controller 開發規範、前端資料夾取策略。

### Frontend Architecture

- **狀態管理**: TanStack Query (React Query) 搭配 Zustand
  - **版本**: TanStack Query v5, Zustand v4+
  - **Rationale**: Next.js App Router 預設以 Server Components 為主，透過 TanStack Query 管理客戶端的非同步狀態（Server State），並以 Zustand 管理輕量級 UI 狀態，能最小化重新渲染的範圍。
  - **Affects**: 前端元件設計架構、資料擷取層。

### Infrastructure & Deployment

- **基礎架構配置**: Docker Compose 容器化部署
  - **Rationale**: 針對目前已建置的技術堆疊，搭配 Docker Compose 可以確保開發環境、測試環境的一致性，並快速建立包含 Postgres、Mongo 的服務鏈結。
  - **Affects**: DevOps 流程、部署腳本 (Dockerfile)。

### Decision Impact Analysis

**Implementation Sequence:**
1. **Docker Compose 環境建立**：首先搭建起 PostgreSQL 與 MongoDB 以提供各個微服務底層資料儲存能力。
2. **RESTful 與 Security 骨架**：完成 Spring Boot 與 Next.js 的 JWT 登入架構驗證，確認通訊層無礙。
3. **Outbox 資料流與 AI 審核系統**：結合 LangChain4j 開發核心的審核、發佈與 MongoDB 向量同步機制。
4. **前端介面堆疊**：使用 TanStack Query 對接 REST API，完成清單、詳情與管理介面。

**Cross-Component Dependencies:**
- 核心的上傳審核流程牽涉到：前端 Zustand 表單狀態 -> 呼叫 RESTful API -> JWT 認證身分 -> 執行 Spring AI/LangChain4j 初審 -> Transaction 落入 PostgreSQL -> Outbox 同步至 MongoDB。這是一個具有強關聯的執行鏈，需要在測試架構中特別加強涵蓋。

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:**
5 areas where AI agents could make different choices

### Naming Patterns

**Database Naming Conventions:**
- Tables: 複數小寫蛇形命名法 (e.g., `skills`, `users`)
- Columns: 小寫蛇形命名法 (e.g., `skill_id`, `created_at`)
- Spring Data JPA entities 將使用 camelCase (e.g., `skillId`)，並交由 Hibernate 自動對映到 snake_case。

**API Naming Conventions:**
- REST Endpoints: 複數名詞、小寫 kebab-case (e.g., `/api/v1/ai-skills`, `/api/v1/users/{user-id}/skills`)
- 嚴禁把動詞放在 URL 路徑中，請使用標準 HTTP Methods (GET, POST, PUT, DELETE)。

**Code Naming Conventions:**
- React/Next.js Components: 匯出名稱使用 PascalCase (`SkillCard`)，檔案名稱使用 kebab-case (`skill-card.tsx`).
- Variables/Functions: 使用 camelCase (`getSkill()`, `userId`).

### Structure Patterns

**Project Organization:**
- Next.js: 依據功能模組化存放於 `src/app` 路由內，或統一放置於 `src/components` 目錄之下。
- Spring Boot: 參照 `CLAUDE.md` 中定義的目錄結構 `api`, `service`, `repository`, `domain` 等扁平化或聚合架構。

**File Structure Patterns:**
- 後端測試檔案應平行放置於相對應之 `src/test/java/...` 對齊原始碼路徑。

### Format Patterns

**API Response Formats:**
所有的 API 回覆都「必須」嚴格遵守 `CLAUDE.md` 中定義的 Envelope 格式:
```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "meta": { "total": 100, "page": 1, "limit": 20 }
}
```
Spring Boot 的 Controllers 必須配合一個全域的 `RestControllerAdvice` 來將正常回傳值與例外拋出（Exceptions）統一打包進這個格式中。

**Data Exchange Formats:**
- JSON 鍵值命名: 輸入與輸出皆採用 camelCase。
- 日期時間: 統一採用 ISO 8601 標準字串 (e.g., `2026-03-03T12:00:00Z`).

### Communication Patterns

**Event System Patterns:**
- PostgreSQL/MongoDB Outbox Sync: 採用 Spring 的 `@Scheduled` 每分鐘掃描落後資料機制，狀態流轉定義為 `PENDING_SYNC` -> `SYNCED`。

**State Management Patterns:**
- TanStack Query 負責處理所有與伺服器通訊的邏輯（快取、重新提取、非同步狀態）。
- Zustand 專注於管理與伺服器無關的純前端 UI 狀態（例如 Modal 開關、搜尋過濾器暫存字串）。

### Process Patterns

**Error Handling Patterns:**
- Frontend: TanStack Query 全域攔截發生於 API 的 Error（依據回傳的 `success: false` 與 `error`），並使用共用的 Toast 元件提示操作者。避免在每個元件中各自 try-catch。
- Backend: 所有業務邏輯錯誤應 throws Customer Exception，由 `@ExceptionHandler` 接手處理並填充進統一的回應 Envelope，同時返回正確的 HTTP Status Code (4xx/5xx)。

**Loading State Patterns:**
- Frontend: 充份利用 TanStack Query 提供的 `isLoading`, `isPending` 等標誌來觸發 UI 上的 Skeleton 佔位符或 Spinner 機制。

### Enforcement Guidelines

**All AI Agents MUST:**

- 針對所有後端 REST 提供 Endpoint 「必定」使用統一的 API Response Wrapper。
- 針對 Next.js 前端，元件檔案名稱「必定」使用 kebab-case，且 export 名稱「必定」使用 PascalCase。
- 資料庫資料表命名「必定」使用 複數與 snake_case 模式。

**Pattern Enforcement:**

- PR Reviews 或 AI 審查流程 (`bmad-bmm-code-review`) 將明確把未遵從 API 回覆 Wrapper 的端點標註為「不給過」(Reject)。
- 自動化測試需包含檢驗例外回覆結構之測試目標。

### Pattern Examples

**Good Examples:**
```typescript
// components/ui/skill-card.tsx
export function SkillCard() { return <div>...</div> }
```
```java
// Spring Boot Exception Handler
return ResponseEntity.status(HttpStatus.NOT_FOUND)
    .body(new ApiResponse<>(false, null, "Skill not found", null));
```

**Anti-Patterns:**
```typescript
// components/ui/SkillCard.tsx - 錯誤的檔案大小寫命名
// /api/v1/getSkill - 錯誤的 RESTful 設計（帶有動詞且 camelCase）
```
```java
// Spring Boot Bad Return
// 直接回傳 Entity 而不是 ApiResponse Envelope
return mySkillEntity; 
```

## Project Structure & Boundaries

### Complete Project Directory Structure

```text
AgentsGate/
├── docker-compose.yml           # 定義 PostgreSQL、MongoDB 與各項依賴服務
├── README.md                    # 專案入口宣告
├── CLAUDE.md                    # (現有) AI 協作規範與架構說明
├── .github/                     # (現有) GitHub Actions 與 Copilot 規則
├── _bmad/                       # (現有) 方法論模組設定
├── frontend/                    # Next.js 15+ App Router 專案
│   ├── package.json
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── src/
│   │   ├── app/                 # App Router 入口
│   │   │   ├── (auth)/          # 登入與註冊頁面 (Route Group)
│   │   │   ├── admin/           # 管理與審核後台
│   │   │   ├── explore/         # 搜尋與推薦列表頁
│   │   │   ├── skill/           # Skill 上傳與詳細頁
│   │   │   ├── layout.tsx       # 全局 Layout (含 Navbar/Footer)
│   │   │   └── page.tsx         # 首頁
│   │   ├── components/          # 跨頁面共用 UI 元件
│   │   │   ├── ui/              # 原子級元件 (如 Button, Input)
│   │   │   └── features/        # 功能級元件 (如 SkillCard, SearchBar)
│   │   ├── lib/                 # 工具函式與第三方實例
│   │   │   ├── api-client/      # TanStack Query 或 Fetch 的封裝
│   │   │   ├── auth/            # NextAuth/Auth.js 驗證邏輯
│   │   │   └── store/           # Zustand store 狀態管理
│   │   └── types/               # TypeScript 全局型別 (包含 OpenAPI 轉譯的 DTO)
│   └── tests/                   # 前端測試 (Vitest / Playwright)
│
└── backend/                     # Spring Boot 3.x 專案
    ├── pom.xml
    ├── src/main/resources/
    │   └── application.yml      # DB、JWT、Anthropic API Key 等設定
    ├── src/main/java/com/agentsgate/
    │   ├── AgentsGateApplication.java
    │   ├── config/              # Security, OpenAPI, CORS 等全域設定
    │   ├── api/                 # REST Controllers (入口點)
    │   │   ├── SkillController.java
    │   │   ├── AuthController.java
    │   │   └── AdminController.java
    │   ├── service/             # 業務邏輯層
    │   │   ├── review/          # LangChain4j AI 審核流程
    │   │   ├── packaging/       # CLI 安裝套件與腳本打包
    │   │   ├── search/          # MongoDB 語義搜尋與關鍵字檢索
    │   │   ├── sync/            # Outbox Pattern 到 MongoDB 的同步排程 (@Scheduled)
    │   │   └── auth/            # JWT 產生與驗證
    │   ├── repository/          # 資料存取層
    │   │   ├── jpa/             # Spring Data JPA (PostgreSQL)
    │   │   └── mongo/           # Spring Data MongoDB
    │   ├── domain/              # 實體模型
    │   │   ├── entity/          # JPA Entities (如 User, Skill, OutboxEvent)
    │   │   └── document/        # MongoDB Documents
    │   └── exception/           # 全域錯誤處理 (@RestControllerAdvice)
    └── src/test/java/com/agentsgate/ # JUnit / Testcontainers 整合測試
        ├── service/
        └── api/
```

### Architectural Boundaries

**API Boundaries:**
- **RESTful Gateway**: 全部的對外溝通皆由 Spring Boot `api/` 下的 Controller 暴露，前端完全透過 Client Fetch 呼叫。不允許 Controller 包含商業邏輯，僅做 DTO 轉換與 HTTP 狀態碼分配。
- **AI Service Boundary**: 所有的 LLM 交互 (透過 `LangChain4j`) 被限制在 `service/review/` 和 `service/search/`，不能跨越到 `api/` 層或前端。

**Component Boundaries:**
- **前端 View vs Logic**: React Component 內部僅處理畫面與使用者交互；資料拉取邏輯必須抽離至 `lib/api-client` 並包裝成 custom hooks (搭配 TanStack Query) 使用。
- **Zustand vs URL State**: 分享有意義的狀態 (例如目前的搜尋關鍵字) 必須反映在 URL 上 (Search Params)；只有單純的操作狀態 (例如 Modal 打開與否) 放進 Zustand。

**Service Boundaries:**
- 後端服務之間採 `@Service` 依賴注入，為避免循環相依，將審核 (`review`)、搜尋 (`search`) 和封裝 (`packaging`) 等具體領域功能獨立，共通功能如認證 (`auth`) 提升至共用層。

**Data Boundaries:**
- **PostgreSQL vs MongoDB**: PostgreSQL 為「唯真資料源 (Single Source of Truth)」，負責 ACID 交易操作；MongoDB 僅作為「讀取優化」與「向量檢索」視圖。所有 MongoDB 的更新只能從 PostgreSQL 的 Outbox 事件驅動。

### Requirements to Structure Mapping

**Feature/Epic Mapping:**
- **上傳與審核功能**
  - Frontend: `src/app/skill/upload/`, `src/lib/store/upload-store.ts`
  - Backend: `api/SkillController.java`, `service/review/SkillReviewService.java`
  - Database: `domain/entity/Skill.java`, `domain/entity/ReviewLog.java`
- **套件產生與下載功能**
  - Backend: `service/packaging/PackageGeneratorService.java` (實作各 CLI 腳本封裝邏輯)

**Cross-Cutting Concerns:**
- **認證機制 (JWT)**
  - Frontend: `src/app/(auth)/`, `src/lib/auth/`
  - Backend: `config/SecurityConfig.java`, `service/auth/JwtService.java`

### Integration Points

**Internal Communication:**
前端經由 RESTful HTTP 呼叫後端建立在 `api/` 中的各個 Endpoint。開發環境透由 CORS 設定或是 Next.js API Routes Proxy 協助介接。

**External Integrations:**
- 登入：由 NextAuth 整合例如 Google, GitHub OAuth (若有)，後端提供 API 核發專有 JWT。
- 向量搜尋與內容分析：後端 Langchain4j 介接 Anthropic Claude 模型 API 進行 Skill 的 AI 審核並取得 embeddings 送往 MongoDB。

**Data Flow:**
Data -> Backend Repository -> Service -> Controller (Wrapper) -> Next.js API Client -> TanStack Query -> UI Component.

### File Organization Patterns

**Configuration Files:**
- Web: `next.config.ts`, `tailwind.config.ts` (前端根目錄)
- Backend: `application.yml` (資源目錄) 以及 `@Configuration` class 統一放置於 `config/`
- DevOps/Infra: `.github/workflows/` (GitHub), `docker-compose.yml` (根目錄) 

**Source Organization:**
- Domain-driven / Feature-based 在前端，Layered Architecture 在後端，藉由 Outbox 排程作為非同步緩衝層。

**Test Organization:**
- 與程式碼保持路徑映射（Mappng），例如 `src/main/java/xyz/Service.java` 其測試應在 `src/test/java/xyz/ServiceTest.java`

**Asset Organization:**
- 靜態圖檔、字型集中於前端的 `public/` 目錄。
- 如果有由後端生成的動態內容（如 ZIP 壓縮包），回傳位元串流 (Byte Stream) 交給前端接收下載，不在 Server 本地留存。

### Development Workflow Integration

**Development Server Structure:**
- 雙服務各自獨立啟動: 前端 `npm run dev` (Port 3000), 後端 `./mvnw spring-boot:run` (Port 8080)。
- 共用 DB: 依賴根目錄 `docker-compose up -d` 運行 Postgres 與 MongoDB。

**Build Process Structure:**
- 前端進行靜態/SSR構建打包；後端使用 Maven 封裝成可執行的 `jar` 檔。

**Deployment Structure:**
- Docker Image 打包策略，將前端及後端各封裝為 Image 進行部署。

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
前後端技術棧與資料庫策略完全相容。JWT 無狀態機制與 Spring Security / NextAuth 的整合是業界成熟的實踐；PostgreSQL 作為主資料庫搭配 MongoDB 作為向量搜尋的 Outbox 同步機制，解決了分散式檢索的痛點。

**Pattern Consistency:**
檔案命名（前端 kebab-case、後端 camelCase/PascalCase）與 API 溝通規範（嚴格的 Response Wrapper）非常明確，能有效避免 AI Agent 之間的實作分歧。

**Structure Alignment:**
Monorepo 的切分明確，`/frontend` 與 `/backend` 各自擁有獨立的生命週期與設定檔，並藉由 `docker-compose.yml` 於根目錄統整基礎設施。

### Requirements Coverage Validation ✅

**Feature Coverage:**
- Skill 上傳、覆寫規則、狀態機、CLI 腳本打包與語義搜尋皆有明確的對應模組或服務邊界。

**Non-Functional Requirements Coverage:**
- 效能：MongoDB 專司向量檢索。
- 安全性與 AI 防護：Spring Boot 攔截器與 LangChain4j 的審核層。

### Implementation Readiness Validation ✅

**Decision Completeness:**
所有關鍵的核心技術與框架版本（Next.js App Router, Spring Boot 3.4/3.5, DBs）皆已敲定。

**Structure Completeness:**
完整的目錄樹定義完畢，未來 AI Agents 可依據此樹狀圖進行具體檔案的生成。

**Pattern Completeness:**
已詳細規範 REST API、資料庫與變數的命名準則。

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**✅ Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**✅ Implementation Patterns**
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**✅ Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High (基於成熟的官方 Starter 與嚴謹的 BMad 規範)

**Key Strengths:**
- 高度解耦的全端架構
- 針對多個 AI Agent 協作設計了防錯規範
- 資料一致性設計穩固 (Outbox Pattern)

**Implementation Handoff:**
**First Implementation Priority:** 
首先建立 `docker-compose.yml` 運行 PostgreSQL 與 MongoDB，再分別執行 `create-next-app` 與 Spring Initializr `curl` 指令產生基礎框架。

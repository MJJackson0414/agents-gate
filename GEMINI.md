# AgentsGate - AI Skill 與 Sub-Agent 分享平台

這是一個基於 **BMAD Method v6.0.4** 方法論開發的 AI Skill 與 Sub-Agent 分享平台。其核心理念是「上傳一次，適配所有 CLI，下載即用，零設定」。

## 專案概述

*   **目標**：提供一個中心化的平台，讓開發者上傳 AI Skill 或 Agent，並自動適配多種 CLI 工具（Claude Code, GitHub Copilot, Gemini CLI, Kiro CLI 等）。
*   **核心技術架構**：
    *   **前端**：Next.js (App Router) + TypeScript + Tailwind CSS
    *   **後端**：Java 21 + Spring Boot 3.x
    *   **AI 整合**：Spring AI + LangChain4j (用於審核流程與 RAG)
    *   **資料庫**：PostgreSQL (主資料) + MongoDB (向量搜尋)
*   **方法論**：深度整合 BMAD (Business Model & AI Driven) 方法論，包含 BMM, BMB, CIS, TEA 等模組。

## 專案目錄結構

*   `_bmad/`：BMAD 方法論核心配置與模組（core, bmm, bmb, cis, tea）。
*   `.agent/`, `.agents/`, `.gemini/`, `.github/`, `.kiro/`, `.kilocode/`, `.clinerules/`：各類 CLI 工具的適配檔案與技能定義。
*   `CLAUDE.md`：詳細的技術規格、API 定義與開發規範。
*   `project_analysis.md`：專案現況分析與開發建議報告。
*   `GEMINI.md`：Gemini CLI 的專屬指令與上下文（即本文件）。

## 開發指南

目前專案處於規劃與工具鏈設定階段，實際的應用程式碼（`frontend/`, `backend/`）尚未建立。

### 關鍵指令 (TODO)

> [!NOTE]
> 以下指令根據 `CLAUDE.md` 預測，待目錄建立後需更新。

*   **啟動基礎設施**：`docker-compose up -d`
*   **啟動前端**：`cd frontend && npm run dev`
*   **啟動後端**：`cd backend && ./mvnw spring-boot:run`
*   **執行測試**：
    *   後端：`./mvnw test`
    *   前端：`npm test`

## BMAD 工作流 (重要)

本專案已安裝完整的 BMAD 工具鏈，可透過 Gemini CLI 呼叫以下工作流來輔助開發：

| 工作流 | 用途 |
| :--- | :--- |
| `bmad-bmm-create-prd` | 建立完整的 PRD 文件 |
| `bmad-bmm-create-architecture` | 建立技術架構設計文件 |
| `bmad-bmm-create-epics-and-stories` | 需求拆分為 Epic 與 User Story |
| `bmad-bmm-sprint-planning` | 產生 Sprint 計畫 |
| `bmad-bmm-dev-story` | 執行 Story 實作 |

## 開發規範

1.  **語言規範**：所有交互、文件、註解必須使用 **繁體中文**。
2.  **方法論規範**：嚴格遵循 BMAD 方法論流程進行開發。
3.  **適配規範**：上傳之 Skill 需考量多 CLI 相容性，MCP 規格會導致 Gemini CLI 不支援。
4.  **安全規範**：AI 審核流程會檢查惡意指令與 Prompt Injection。

## 聯絡資訊

*   **專案擁有者**：Jackson
*   **方法論版本**：BMAD v6.0.4

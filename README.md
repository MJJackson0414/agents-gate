# AgentsGate

AI Skill 與 Sub-Agent 的分享平台。

> **上傳一次，適配所有 CLI，下載即用，零設定。**

開發者上傳 Skill 或 Agent 後，平台自動產生各 CLI 的適配檔案（Claude Code、GitHub Copilot、Gemini CLI、Kiro），使用者下載後一鍵安裝，不需額外設定。

---

## 系統架構

```
Frontend (Next.js 16)   →   Backend (Spring Boot 3)   →   PostgreSQL 16
http://localhost:3000       http://localhost:8080           port 5432
                                                        →   MongoDB 7
                                                            port 27017
```

---

## 前置需求

請確認本機已安裝以下工具：

| 工具 | 版本 | 說明 |
|------|------|------|
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | 最新版 | 啟動 PostgreSQL + MongoDB |
| [Node.js](https://nodejs.org/) | 18+ | 前端開發 |
| [Java JDK](https://adoptium.net/) | 21 | 後端開發 |

> Maven Wrapper（`mvnw.cmd`）已內建，不需另外安裝 Maven。

---

## 快速啟動（開發環境）

### 步驟 1：啟動資料庫

```bash
docker-compose up -d
```

確認容器正常運行：

```bash
docker ps
# 應看到 agentsgate-postgres 和 agentsgate-mongo 狀態為 healthy
```

### 步驟 2：設定後端環境變數並啟動

**Windows PowerShell：**

```powershell
cd backend

$env:ANTHROPIC_API_KEY = "sk-ant-api03-your-key-here"

.\mvnw.cmd spring-boot:run
```

**Windows CMD：**

```cmd
cd backend

set ANTHROPIC_API_KEY=sk-ant-api03-your-key-here

mvnw.cmd spring-boot:run
```

後端啟動後：
- API 服務：http://localhost:8080
- 首次啟動會自動 seed 54 個 BMAD 範例 Skills（僅在資料庫空白時執行）

### 步驟 3：啟動前端

```bash
cd frontend

npm install        # 首次執行，之後可省略

npm run dev
```

前端啟動後：
- 前台：http://localhost:3000
- 管理後台：http://localhost:3000/admin/reviews（預設密碼：`admin1234`）

---

## 環境變數

### 後端

| 變數 | 預設值 | 說明 |
|------|--------|------|
| `ANTHROPIC_API_KEY` | 無（必填） | Claude API 金鑰，用於 AI 自動審核 |
| `DB_URL` | `jdbc:postgresql://localhost:5432/agentsgate` | PostgreSQL 連線 |
| `DB_USER` | `agentsgate` | PostgreSQL 帳號 |
| `DB_PASSWORD` | `agentsgate` | PostgreSQL 密碼 |
| `ADMIN_PASSWORD` | `admin1234` | 管理後台登入密碼 |
| `CORS_ORIGINS` | `http://localhost:3000` | 允許的前端來源 |

取得 API 金鑰：https://console.anthropic.com/

### 前端

檔案位置：`frontend/.env.local`（已存在，通常不需修改）

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

---

## 常用指令

### 後端（在 `backend/` 目錄下執行）

```powershell
# 啟動開發伺服器
.\mvnw.cmd spring-boot:run

# 編譯
.\mvnw.cmd compile

# 執行所有測試
.\mvnw.cmd test

# 執行指定測試
.\mvnw.cmd test -Dtest=SkillServiceTest

# 打包（跳過測試）
.\mvnw.cmd package -DskipTests
```

### 前端（在 `frontend/` 目錄下執行）

```bash
# 啟動開發伺服器（Hot Reload）
npm run dev

# 生產建置（同時驗證 TypeScript）
npm run build

# ESLint 檢查
npm run lint
```

### 資料庫

```bash
# 啟動
docker-compose up -d

# 停止（保留資料）
docker-compose stop

# 停止並移除容器（保留 volume 資料）
docker-compose down

# 完全清除（含資料 volume）
docker-compose down -v

# 查看 PostgreSQL log
docker logs agentsgate-postgres
```

---

## 主要功能頁面

| 頁面 | 網址 | 說明 |
|------|------|------|
| 首頁 | http://localhost:3000 | 瀏覽、搜尋 Skills & Agents |
| 詳細頁 | http://localhost:3000/skills/{id} | Skill/Agent 完整資訊 + 安裝指令 |
| 上傳精靈 | http://localhost:3000/upload | 4 步驟上傳 Skill/Agent |
| 管理後台 | http://localhost:3000/admin/reviews | 人工審核（密碼驗證） |

---

## CLI 套件封裝與發布機制（已實作）

當開發者上傳 Skill / Agent 並通過管理員審核後，後端會啟動自動化發布流程：

1. **套件封裝**：後端（`CliPackageService`）會將資料庫內容結合 `cli-template/`，動態綁定版號並打包成完整的 Node.js 安裝套件包。
2. **自動發布**：後端（`NpmPublishService`）會自動產生 `.npmrc` 並將套件推送到內部的 Nexus NPM Registry（`http://192.168.64.7:8081/repository/npm-hosted/`）。
3. **管理員捷徑**：管理員在後台審核通過時，畫面會彈出提示並支援一鍵開啟新分頁前往 Nexus 查看該套件。

使用者不再需要手動下載壓縮包，只需在終端機執行標準 `npx` 指令即可安裝（建議加上 `@latest` 確保取得最新版）：

```bash
npx your-skill-name@latest --registry=http://192.168.64.7:8081/
```

執行後會出現互動程式，帶來以下自動化安裝體驗：

- **自動依據相容性過濾 CLI 選單**：若該 Skill 標記為 Claude 專屬（`sourceCliFormat=CLAUDE`），安裝時的互動菜單只會顯示 `.claude/skills`，自動隱藏無關選項。
- **標準 Markdown Frontmatter 注入**：產出的 `SKILL.md` (或 `AGENT.md`) 皆會被嚴格確保包含標準的 YAML Frontmatter（包含 `name`, `description`, `user-invocable`）。
- **附加目錄完整遞迴拷貝**：除了主要文件，上傳的 `scripts/`（腳本）等附屬工具，都會隨同安裝被遞迴複製進終端使用者目錄，並內建防無限迴圈機制。
- **動態參數智慧取代**：支援使用者輸入自訂參數並自動替換 `{VAR}` 或 `{{VAR}}` 的佔位符，且能同步更新下載目錄中的原始範本。
- **簡潔直觀的套件命名**：自動將名稱轉換為 `package.json` 的 `bin` 指令名稱（全小寫連字號），與 npm 社群標準完美接軌！

如果開發者想要獨立測試，可參閱內部範本說明的 [`cli-template/README.md`](./cli-template/README.md)。

---

## 目前實作進度

| 功能 | 狀態 |
|------|------|
| 首頁瀏覽 + 搜尋 + 分頁 | ✅ 完成 |
| Skill/Agent 上傳精靈（4 步驟） | ✅ 完成 |
| 變數自動偵測 & 附加檔案 | ✅ 完成 |
| AI 自動審核（Claude Sonnet 4.6） | ✅ 完成 |
| 人工審核後台 | ✅ 完成 |
| Skill/Agent 詳細頁 | ✅ 完成 |
| CLI 下載套件封裝 | ✅ 完成 |
| 使用者認證（JWT） | ⬜ 規劃中 |
| 語義搜尋（MongoDB RAG） | ⬜ 規劃中 |

---

## 常見問題

**Q：後端 log 顯示亂碼？**
使用 `.\mvnw.cmd` 而非直接呼叫 `mvn`，Wrapper 會自動切換 UTF-8 終端機。

**Q：首頁資料為空？**
確認 Docker 容器正在運行（`docker ps`），並確認後端已啟動。

**Q：AI 審核沒有觸發？**
確認 `ANTHROPIC_API_KEY` 環境變數已正確設定，後端 log 會顯示審核結果。

**Q：上傳後看不到新資料？**
首頁只顯示 `PUBLISHED`、`PENDING_AI_REVIEW`、`PENDING_HUMAN_REVIEW` 狀態的 Skill。
若 AI 審核拒絕（`AI_REJECTED_REVIEW`），需在管理後台手動複審後才會顯示。

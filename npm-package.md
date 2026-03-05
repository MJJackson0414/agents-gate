# 透過 npm / npx 發布與封裝 Claude/Gemini Skill 教學

這份教學文件將引導你如何將撰寫好的 `SKILL.md` 封裝成一個 Node.js 套件，並發布至 npm 平台，讓其他人可以透過簡單的 `npx` 指令進入**互動式選單**下載並安裝你的 Skill。

## 1. 專案結構

為了讓 npm 認識你的套件，我們需要建立以下的核心檔案與結構：

```
your-skill-project/
├── package.json      # 套件設定檔（宣告名稱、版本與執行的腳本）
├── SKILL.md          # 你的核心 Skill 內容
├── config.json       # 動態問答設定檔（定義使用者安裝時需要填寫的參數）
└── bin/
    └── index.js      # npx 執行時觸發的安裝腳本 (處理互動選單與動態替換)
```

## 2. 建立與設定 package.json

`package.json` 是 npm 套件的核心。你需要特別注意 `name` (套件名稱必須在 npm 上唯一) 以及 `bin` (設定 npx 執行的路徑)。並且記得在 `files` 中包含所有會用到的檔案。

```json
{
  "name": "your-unique-skill-lookup",  // ⚠️ 請修改成你專屬的套件名稱，例如: yungyuan-skill-lookup
  "version": "1.0.0",
  "description": "Installer for skill-lookup AI skill",
  "bin": {
    "install-skill-lookup": "./bin/index.js" // 這裡定義了可執行指令
  },
  "keywords": [
    "ai",
    "skill",
    "claude",
    "gemini"
  ],
  "author": "Your Name",
  "license": "MIT",
  "files": [
    "bin/index.js",
    "SKILL.md",
    "config.json"
  ]
}
```

## 3. 設定動態安裝參數 (`config.json`)

這套系統支援在使用者安裝時，透過命令列互動取得他們專屬的設定（例如 API Token、偏好模型等），並將這些設定塞進 `SKILL.md`。

編輯根目錄下的 `config.json`，根據需求定義要詢問使用者的問題：

```json
[
  {
    "key": "TOKEN",
    "prompt": "請輸入您的 API Token (若無請直接按 Enter 跳過): "
  },
  {
    "key": "MODEL",
    "prompt": "請輸入您的偏好模型 (例如 gemini-2.5-flash): "
  }
]
```

## 4. 在文件內宣告動態變數 (`SKILL.md`)

定義好 `config.json` 之後，你可以在腳本 `SKILL.md` 的任何角落放置對應的佔位符號 `{{KEY}}`。安裝時系統便會全自動將它取代為使用者輸入的內容：

```markdown
# 這是我的 AI Skill
使用者需要使用的 Token 是： {{TOKEN}}
AI 將會採用此模型： {{MODEL}}
```

> **機制說明：** 
> 1. 當使用者安裝輸入 Token 後，文件內的 `{{TOKEN}}` 就會直接變成該字串。
> 2. 如果使用者有填寫參數，但你在 `SKILL.md` 裡面 **忘記放對應的標籤**，系統會自動在文件最底端加上一個 `## 動態安裝帶入的使用者設定` 的區塊紀錄起來，確保資料不會遺失！

## 5. 互動式安裝腳本 (`bin/index.js`)

系統內建強大的 `bin/index.js` 互動腳本，提供了以下絕佳的安裝體驗：

- **多重路徑支援**：支援使用「上下鍵」移動與「空白鍵」複選安裝路徑（.claude/skills、.gemini/skills，或是自訂路徑）。
- **動態參數讀取**：自動解析剛剛設定好的 `config.json` 進行一連串提問。
- **寫入與取代**：一鍵將修改好的 `SKILL.md` 佈署到使用者選定的所有 AI 目錄中。

*(開發注意：確保你的 `bin/index.js` 已具備執行權限，可透過 `chmod +x bin/index.js` 設定)*

## 6. 在本地測試套件 (Local Testing)

在正式發布之前，建議先在本地測試腳本是否運作正常。

1. 在你的專案目錄執行以下指令，這會將你的套件連結到全域：
   ```bash
   npm link
   ```
2. 執行你定義在 `package.json` 中的 `bin` 指令測試互動選單：
   ```bash
   install-skill-lookup
   ```
3. 按照畫面提示進行勾選與填寫，檢查安裝後的 `SKILL.md` 是否有如期動態取代。

## 7. 發布至 npm 平台

確定本地測試沒問題後，就可以將套件公開發布。

1. **註冊 npm 帳號**：如果你還沒有帳號，請至 [npm 首頁](https://www.npmjs.com/) 註冊。
2. **在終端機登入 npm**：在你的專案目錄下執行：
   ```bash
   npm login
   ```
3. **發布套件**：
   ```bash
   npm publish
   ```
   *如果出現名稱衝突（例如 403 Forbidden），表示 `package.json` 的 `name` 已經被別人用過了，請改名後再試。*

## 8. 提供給其他人使用

發布成功後，你就可以將這個指令分享給其他人了。
其他人只需要在他們的終端機（任何專案目錄下）執行：

```bash
npx your-unique-skill-lookup
```

系統就會自動：
1. 下載你的套件。
2. 觸發強大的互動命令列，讓使用者勾選 Claude / Gemini，並填寫所需的 `TOKEN` 等動態參數。
3. 把客製化完成的 `SKILL.md` 自動部署到他們的開發環境中！

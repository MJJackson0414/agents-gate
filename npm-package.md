# 透過 npm / npx 發布與封裝 Claude Skill 教學

這份教學文件將引導你如何將撰寫好的 `SKILL.md` 封裝成一個 Node.js 套件，並發布至 npm 平台，讓其他人可以透過簡單的 `npx` 指令下載並安裝你的 Skill。

## 1. 專案結構

為了讓 npm 認識你的套件，我們需要建立以下的核心檔案與結構：

```
your-skill-project/
├── package.json      # 套件設定檔（宣告名稱、版本與執行的腳本）
├── SKILL.md          # 你的核心 Skill 內容
└── bin/
    └── index.js      # npx 執行時觸發的安裝腳本
```

## 2. 建立 package.json

`package.json` 是 npm 套件的核心。你需要特別注意 `name` (套件名稱必須在 npm 上唯一) 以及 `bin` (設定 npx 執行的路徑)。

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
    "claude"
  ],
  "author": "Your Name",
  "license": "MIT",
  "files": [
    "bin/index.js",
    "SKILL.md"
  ]
}
```

> **注意：** `files` 陣列定義了發布到 npm 時要包含的檔案，請確保有包含 `bin/index.js` 與 `SKILL.md`。

## 3. 撰寫安裝腳本 (`bin/index.js`)

當使用者執行 `npx <你的套件名稱>` 時，系統會下載套件並執行這支腳本。腳本的功能是將 `SKILL.md` 複製到使用者專案中的 `.claude/skills/<skill-name>` 目錄下。

建立 `bin/index.js`，內容如下：

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 設定要複製到的目標路徑，預設複製到執行指令的使用者專案目錄下
const skillName = 'skill-lookup'; // 你的 skill 目錄名稱
const targetDir = path.join(process.cwd(), '.claude', 'skills', skillName);

// 來源檔案位置 (`__dirname` 就是 bin 目錄)
const sourceFile = path.join(__dirname, '..', 'SKILL.md');
const targetFile = path.join(targetDir, 'SKILL.md');

try {
  // 建立目標資料夾（如果不存在的話，包含上層的 .claude/skills）
  fs.mkdirSync(targetDir, { recursive: true });

  // 複製 SKILL.md 檔案
  fs.copyFileSync(sourceFile, targetFile);
  
  console.log('\x1b[32m%s\x1b[0m', `✅ 成功安裝 ${skillName}！`);
  console.log(`📂 檔案已儲存至: ${targetFile}`);
} catch (err) {
  console.error('\x1b[31m%s\x1b[0m', `❌ 安裝 ${skillName} 發生錯誤:`, err.message);
  process.exit(1);
}
```

> **重要步驟：** 你必須為這個腳本加入可執行權限。
> 在終端機執行：`chmod +x bin/index.js`

## 4. 在本地測試套件 (Local Testing)

在正式發布之前，建議先在本地測試腳本是否運作正常。

1. 在你的專案目錄 (`your-skill-project/`) 執行以下指令，這會將你的套件連結到全域：
   ```bash
   npm link
   ```
2. 開啟另一個新的空白資料夾（模擬使用者的環境）。
3. 執行你定義在 `package.json` 中的 `bin` 指令（也可以直接模擬 npx）：
   ```bash
   install-skill-lookup
   ```
4. 檢查該資料夾下是否成功產生了 `.claude/skills/skill-lookup/SKILL.md` 檔案。

## 5. 發布至 npm 平台

確定本地測試沒問題後，就可以將套件公開發布。

1. **註冊 npm 帳號**：如果你還沒有帳號，請至 [npm 首頁](https://www.npmjs.com/) 註冊。
2. **在終端機登入 npm**：在你的專案目錄下執行：
   ```bash
   npm login
   ```
   *系統會開啟瀏覽器或提示你輸入帳號、密碼及 OTP 認證碼。*
3. **發布套件**：
   ```bash
   npm publish
   ```
   *如果出現名稱衝突（403 Forbidden 或類似錯誤），表示 `package.json` 的 `name` 已經被別人用過了，請改名後再試。*

## 6. 提供給其他人使用

發布成功後，你就可以將這個指令分享給其他人了。
其他人只需要在他們的終端機（任何專案目錄下）執行：

```bash
npx your-unique-skill-lookup
```
*(請將 `your-unique-skill-lookup` 替換成你實際發布的 npm 套件名稱)*

系統就會自動：
1. 下載你的套件。
2. 執行你的 `bin/index.js` 安裝腳本。
3. 把 `SKILL.md` 放進他們專案的 `.claude/skills/` 目錄中。

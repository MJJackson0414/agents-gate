#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const skillName = 'skill-lookup';
let sourceFileType = 'SKILL.md';
let sourceFile = path.join(__dirname, '..', 'SKILL.md');

if (!fs.existsSync(sourceFile)) {
    if (fs.existsSync(path.join(__dirname, '..', 'AGENT.md'))) {
        sourceFileType = 'AGENT.md';
        sourceFile = path.join(__dirname, '..', 'AGENT.md');
    }
}

const targetCliFormat = 'ALL'; // THIS_WILL_BE_REPLACED_BY_BACKEND

const allOptions = [
    { label: 'Claude (.claude/skills)', value: '.claude/skills', cli: 'CLAUDE', selected: false },
    { label: 'Gemini (.gemini/skills)', value: '.gemini/skills', cli: 'GEMINI', selected: false },
    { label: 'Gemini Agents (.gemini/agents/skills)', value: '.gemini/agents/skills', cli: 'GEMINI', selected: false },
    { label: '自訂路徑...', value: 'custom', cli: 'ALL', selected: false }
];

let options = allOptions;
if (targetCliFormat && targetCliFormat !== 'ALL' && targetCliFormat !== 'null') {
    options = allOptions.filter(opt => opt.cli === targetCliFormat || opt.cli === 'ALL');
}
if (options.length > 0) {
    options[0].selected = true; // 預設選擇第一個
}

let cursor = 0;
let menuLines = 0;
let isSelectingMenu = true;

// 互動選單渲染函數
function renderMenu() {
    if (menuLines > 0) {
        readline.moveCursor(process.stdout, 0, -menuLines);
        readline.clearScreenDown(process.stdout);
    }

    let output = '\n\x1b[36m🤖 歡迎安裝 ' + skillName + '！\x1b[0m\n\n';
    output += '請問您想要安裝給哪一個 AI 助手使用？ (上下鍵移動，空白鍵切換選取，Enter 確認)\n\n';

    options.forEach((opt, index) => {
        const isSelected = opt.selected ? '\x1b[32m[x]\x1b[0m' : '[ ]';
        const isHovered = index === cursor ? '\x1b[36m>\x1b[0m' : ' ';
        output += `${isHovered} ${isSelected} ${opt.label}\n`;
    });

    process.stdout.write(output);
    menuLines = output.split('\n').length - 1;
}

// 初始化選單
function initMenu() {
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) {
        process.stdin.setRawMode(true);
    }

    renderMenu();

    const onKeyPress = (str, key) => {
        if (!isSelectingMenu) return;

        if (key.sequence === '\u0003' || (key.ctrl && key.name === 'c')) {
            process.exit();
        }

        if (key.name === 'up') {
            cursor = cursor > 0 ? cursor - 1 : options.length - 1;
            renderMenu();
        } else if (key.name === 'down') {
            cursor = cursor < options.length - 1 ? cursor + 1 : 0;
            renderMenu();
        } else if (key.name === 'space') {
            options[cursor].selected = !options[cursor].selected;
            renderMenu();
        } else if (key.name === 'return') {
            isSelectingMenu = false;

            if (process.stdin.isTTY) {
                process.stdin.setRawMode(false);
            }
            process.stdin.removeListener('keypress', onKeyPress);
            // 讓後續的 readline 可以順利接管
            process.stdin.pause();
            process.stdin.resume();

            console.log('\n');
            processSelection();
        }
    };

    process.stdin.on('keypress', onKeyPress);
}

// 產生標準的 readline interface，用於文字輸入
function promptText(question) {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
}

async function processSelection() {
    const selectedOptions = options.filter(opt => opt.selected);

    if (selectedOptions.length === 0) {
        console.log('\x1b[33m⚠️ 您沒有選擇任何路徑，將跳過安裝。\x1b[0m');
        process.exit(0);
    }

    // == 取得動態參數階段 ==
    console.log('\x1b[36m💡 準備設定 Skill 的參數\x1b[0m');

    // 試著讀取外部的 config.json，若不存在則給予空陣列
    let config = [];
    try {
        const configPath = path.join(__dirname, '..', 'config.json');
        if (fs.existsSync(configPath)) {
            config = require(configPath);
        }
    } catch (e) { /* ignore */ }

    const userAnswers = {}; // 儲存使用者回答的所有內容

    // 根據 config 動態詢問
    for (const item of config) {
        const answer = await promptText(item.prompt);
        userAnswers[item.key] = answer;
    }

    // == 安裝階段 ==
    for (const opt of selectedOptions) {
        if (opt.value === 'custom') {
            const customPath = await promptText('請輸入自訂的目標資料夾路徑 (例如: src/skills): ');
            if (customPath) {
                installToPath(customPath.trim(), userAnswers);
            } else {
                console.log('\x1b[31m%s\x1b[0m', '❌ 未提供自訂路徑，跳過。');
            }
        } else {
            installToPath(opt.value, userAnswers);
        }
    }

    // 順便將使用者當前下載的原始檔案也進行更新，避免使用者以為沒生效
    try {
        let content = fs.readFileSync(sourceFile, 'utf-8');
        for (const [key, value] of Object.entries(userAnswers)) {
            if (!value) continue;

            // 支援 {{key}} 與 {key} 兩種格式替換
            const regexDouble = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
            const regexSingle = new RegExp(`\\{${key}\\}`, 'g');

            content = content.replace(regexDouble, value);
            content = content.replace(regexSingle, value);
        }
        fs.writeFileSync(sourceFile, content, 'utf-8');
        console.log(`\n\x1b[36m💡 提示：您目錄下的原始檔案 (${sourceFileType}) 也已同步套用您輸入的參數！\x1b[0m`);
    } catch (err) { /* ignore */ }

    console.log('\x1b[32m%s\x1b[0m', `✅ ${skillName} 安裝與設定設定完畢！\n`);
    process.exit(0);
}

/**
 * 遞迴複製資料夾
 */
function copyDirectoryRecursiveSync(source, target, topTarget) {
    if (!fs.existsSync(target)) {
        fs.mkdirSync(target, { recursive: true });
    }
    const files = fs.readdirSync(source);
    for (const file of files) {
        // 略過安裝腳本、設定檔與 SKILL.md/AGENT.md
        if (['bin', 'package.json', 'config.json', '.DS_Store', 'SKILL.md', 'AGENT.md', '.claude', '.gemini', 'node_modules'].includes(file)) {
            continue;
        }
        const curSource = path.join(source, file);
        const curTarget = path.join(target, file);

        // 防呆：避免無窮迴圈。若目標資料夾剛好選在本安裝包中，會導致自己複製自己。
        if (topTarget) {
            const resolvedSource = path.resolve(curSource);
            const resolvedTop = path.resolve(topTarget);
            if (resolvedTop === resolvedSource || resolvedTop.startsWith(resolvedSource + path.sep)) {
                continue;
            }
        }

        if (fs.lstatSync(curSource).isDirectory()) {
            copyDirectoryRecursiveSync(curSource, curTarget, topTarget);
        } else {
            fs.copyFileSync(curSource, curTarget);
        }
    }
}

/**
 * baseSkillsPath: 安裝路徑
 * paramsObj: 使用者輸入的 { KEY: "值" } 物件
 */
function installToPath(baseSkillsPath, paramsObj) {
    try {
        const targetDir = path.join(process.cwd(), baseSkillsPath, skillName);
        const targetFile = path.join(targetDir, sourceFileType);

        // 建立目標資料夾
        fs.mkdirSync(targetDir, { recursive: true });

        // === 拷貝附加檔案與目錄 (scripts 等) ===
        const sourceDir = path.join(__dirname, '..');
        copyDirectoryRecursiveSync(sourceDir, targetDir, targetDir);

        // 讀取原本的 SKILL.md
        let content = fs.readFileSync(sourceFile, 'utf-8');

        // ========== 動態替換參數 ==========
        // 我們跑迴圈檢查物件裡面的每個 KEY (例如 TOKEN、USERNAME 等)
        // 會把文件中的 {{TOKEN}} 或 {TOKEN} 全部替換掉

        for (const [key, value] of Object.entries(paramsObj)) {
            if (!value) continue; // 如果使用者沒填寫就略過

            // 使用正則運算式達成全域替換 (取代文件內所有出現的地方)
            const regexDouble = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
            const regexSingle = new RegExp(`\\{${key}\\}`, 'g');

            content = content.replace(regexDouble, value);
            content = content.replace(regexSingle, value);
        }

        // 將修改後的文字寫入使用者的目錄
        fs.writeFileSync(targetFile, content, 'utf-8');

        console.log(`📂 已將檔案儲存至: \x1b[36m${targetFile}\x1b[0m`);
    } catch (err) {
        console.error('\x1b[31m%s\x1b[0m', `❌ 安裝至 ${baseSkillsPath} 發生錯誤:`, err.message);
    }
}

// 啟動互動選單
initMenu();

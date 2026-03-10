import JSZip from 'jszip';
import { createExtractorFromData } from 'node-unrar-js/esm/index.esm.js';

export type CliFormat = 'CLAUDE' | 'COPILOT' | 'GEMINI' | 'KIRO';

export interface ParsedArchiveFile {
  path: string;
  content: string;
  size: number;
}

export interface ParsedArchive {
  files: ParsedArchiveFile[];
  entryFile: ParsedArchiveFile | null;
  detectedType: 'SKILL' | 'AGENT' | null;
  parsedMeta: {
    name?: string;
    description?: string;
    version?: string;
    tags?: string[];
  };
  skippedBinaryCount: number;
}

const MAX_ZIP_SIZE = 50 * 1024 * 1024; // 50MB

const TEXT_EXTENSIONS = new Set([
  'md', 'txt', 'py', 'js', 'ts', 'json', 'yaml', 'yml',
  'html', 'css', 'sh', 'ps1', 'bat', 'tsx', 'jsx', 'env',
  'toml', 'ini', 'cfg', 'conf', 'xml', 'csv', 'sql',
]);

// Entry file patterns per CLI type
const ENTRY_PATTERNS: Record<CliFormat, (path: string) => boolean> = {
  CLAUDE: (p) => p.toLowerCase() === 'skill.md',
  COPILOT: (p) => p.endsWith('.agent.md') && !p.includes('/'),
  GEMINI: (p) => p.toLowerCase() === 'skill.md',
  KIRO: (p) => p.endsWith('.md') && !p.includes('/'),
};

function isTextFile(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return TEXT_EXTENSIONS.has(ext);
}

function stripTopLevelDir(paths: string[]): boolean {
  // Returns true if all paths share a common top-level directory
  const tops = new Set(paths.map((p) => p.split('/')[0]));
  return tops.size === 1 && paths.some((p) => p.includes('/'));
}

export function parseFrontmatter(content: string): Record<string, string> {
  const meta: Record<string, string> = {};
  const match = content.match(/^\s*---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return meta;
  for (const line of match[1].split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx < 0) continue;
    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (key && value) meta[key] = value;
  }
  return meta;
}

export function extractBody(content: string): string {
  const match = content.match(/^\s*---\r?\n[\s\S]*?\r?\n---\r?\n?([\s\S]*)$/);
  return match ? match[1].trim() : content.trim();
}

export function detectSkillType(
  frontmatter: Record<string, string>,
  content: string
): 'SKILL' | 'AGENT' | null {
  if (/tools:\s*\[/.test(content) || /^tools:/m.test(content)) return 'AGENT';
  const name = frontmatter['name'];
  const desc = frontmatter['description'];
  if (name && desc) return 'SKILL';
  return null;
}

export async function parseZip(file: File, cli: CliFormat): Promise<ParsedArchive> {
  if (file.size > MAX_ZIP_SIZE) {
    throw new Error(`ZIP 檔案超過 50MB 限制（目前大小：${(file.size / 1024 / 1024).toFixed(1)}MB）`);
  }

  const zip = await JSZip.loadAsync(file);
  const allPaths = Object.keys(zip.files).filter((p) => {
    return !zip.files[p].dir && !p.includes('__MACOSX/') && !p.includes('.DS_Store');
  });

  // Detect and strip common top-level directory (e.g. skill-creator/ wrapping everything)
  const hasCommonRoot = allPaths.length > 0 && stripTopLevelDir(allPaths);
  const normalize = (p: string): string =>
    hasCommonRoot ? p.slice(p.indexOf('/') + 1) : p;

  const files: ParsedArchiveFile[] = [];
  let skippedBinaryCount = 0;

  for (const zipPath of allPaths) {
    const normalizedPath = normalize(zipPath);
    if (!normalizedPath) continue; // skip root dir entry itself

    if (!isTextFile(normalizedPath)) {
      skippedBinaryCount++;
      continue;
    }

    try {
      const content = await zip.files[zipPath].async('text');
      files.push({
        path: normalizedPath,
        content,
        size: content.length,
      });
    } catch {
      skippedBinaryCount++;
    }
  }

  // Sort: entry candidates first, then alphabetically
  files.sort((a, b) => {
    const aEntry = ENTRY_PATTERNS[cli](a.path) ? 0 : 1;
    const bEntry = ENTRY_PATTERNS[cli](b.path) ? 0 : 1;
    if (aEntry !== bEntry) return aEntry - bEntry;
    return a.path.localeCompare(b.path);
  });

  // Find entry file
  const entryFile = files.find((f) => ENTRY_PATTERNS[cli](f.path)) ?? null;

  // Parse metadata from entry file
  const parsedMeta: ParsedArchive['parsedMeta'] = {};
  let detectedType: 'SKILL' | 'AGENT' | null = null;

  if (entryFile) {
    const fm = parseFrontmatter(entryFile.content);
    if (fm['name']) parsedMeta.name = fm['name'];
    if (fm['description']) parsedMeta.description = fm['description'];
    if (fm['version']) parsedMeta.version = fm['version'];
    if (fm['tags']) {
      // Handle "tags: [a, b, c]" or "tags: a, b, c"
      const rawTags = fm['tags'].replace(/[\[\]]/g, '');
      parsedMeta.tags = rawTags.split(',').map((t) => t.trim()).filter(Boolean);
    }
    detectedType = detectSkillType(fm, entryFile.content);
  }

  return { files, entryFile, detectedType, parsedMeta, skippedBinaryCount };
}

async function parseRar(file: File, cli: CliFormat): Promise<ParsedArchive> {
  if (file.size > MAX_ZIP_SIZE) {
    throw new Error(`RAR 檔案超過 50MB 限制（目前大小：${(file.size / 1024 / 1024).toFixed(1)}MB）`);
  }

  // Load WASM binary from public directory (avoids bundler WASM issues)
  const wasmRes = await fetch('/unrar.wasm');
  if (!wasmRes.ok) throw new Error('無法載入 RAR 解壓模組，請重新整理頁面後再試');
  const wasmBinary = await wasmRes.arrayBuffer();

  const buf = await file.arrayBuffer();
  const extractor = await createExtractorFromData({ wasmBinary, data: buf });

  const list = extractor.getFileList();
  const allHeaders = [...list.fileHeaders];
  const fileHeaders = allHeaders.filter((h) => !h.flags.directory);

  const allPaths = fileHeaders
    .map((h) => h.name.replace(/\\/g, '/'))
    .filter((p) => !p.includes('__MACOSX/') && !p.includes('.DS_Store'));
  const hasCommonRoot = allPaths.length > 0 && stripTopLevelDir(allPaths);
  const normalize = (p: string): string => {
    const norm = p.replace(/\\/g, '/');
    return hasCommonRoot ? norm.slice(norm.indexOf('/') + 1) : norm;
  };

  const textPaths = allPaths.filter((p) => isTextFile(p));
  const skippedBinaryCount = allPaths.length - textPaths.length;

  const extracted = extractor.extract({ files: textPaths });
  const files: ParsedArchiveFile[] = [];

  for (const item of extracted.files) {
    if (!item.extraction) continue;
    const normalizedPath = normalize(item.fileHeader.name.replace(/\\/g, '/'));
    if (!normalizedPath) continue;
    const content = new TextDecoder().decode(item.extraction);
    files.push({ path: normalizedPath, content, size: content.length });
  }

  // Sort: entry candidates first, then alphabetically
  files.sort((a, b) => {
    const aEntry = ENTRY_PATTERNS[cli](a.path) ? 0 : 1;
    const bEntry = ENTRY_PATTERNS[cli](b.path) ? 0 : 1;
    if (aEntry !== bEntry) return aEntry - bEntry;
    return a.path.localeCompare(b.path);
  });

  const entryFile = files.find((f) => ENTRY_PATTERNS[cli](f.path)) ?? null;

  const parsedMeta: ParsedArchive['parsedMeta'] = {};
  let detectedType: 'SKILL' | 'AGENT' | null = null;

  if (entryFile) {
    const fm = parseFrontmatter(entryFile.content);
    if (fm['name']) parsedMeta.name = fm['name'];
    if (fm['description']) parsedMeta.description = fm['description'];
    if (fm['version']) parsedMeta.version = fm['version'];
    if (fm['tags']) {
      const rawTags = fm['tags'].replace(/[\[\]]/g, '');
      parsedMeta.tags = rawTags.split(',').map((t) => t.trim()).filter(Boolean);
    }
    detectedType = detectSkillType(fm, entryFile.content);
  }

  return { files, entryFile, detectedType, parsedMeta, skippedBinaryCount };
}

/** Unified entry point — detects format by file extension and delegates to parseZip or parseRar. */
export async function parseArchive(file: File, cli: CliFormat): Promise<ParsedArchive> {
  const lower = file.name.toLowerCase();
  if (lower.endsWith('.rar')) return parseRar(file, cli);
  return parseZip(file, cli);
}

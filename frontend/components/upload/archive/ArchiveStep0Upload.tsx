'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUpload, CliFormat } from '@/lib/upload-context';
import { parseArchive, extractBody, parseFrontmatter } from '@/lib/zip-parser';
import FileTreeViewer from './FileTreeViewer';
import { clsx } from 'clsx';
import { Upload, AlertCircle } from 'lucide-react';

const CLI_OPTIONS: { value: CliFormat; label: string; color: string }[] = [
  { value: 'CLAUDE',  label: 'Claude Code',    color: 'blue' },
  { value: 'COPILOT', label: 'GitHub Copilot', color: 'purple' },
  { value: 'GEMINI',  label: 'Gemini CLI',     color: 'green' },
  { value: 'KIRO',    label: 'Kiro',           color: 'orange' },
];

export default function ArchiveStep0Upload() {
  const router = useRouter();
  const { setArchiveMode, updateForm, setSkillType } = useUpload();

  const [selectedCli, setSelectedCli] = useState<CliFormat>('CLAUDE');
  const [isDragging, setIsDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<Awaited<ReturnType<typeof parseZip>> | null>(null);

  async function handleFile(file: File) {
    if (!file.name.endsWith('.zip') && !file.name.endsWith('.rar')) {
      setParseError('請選擇 .zip 或 .rar 格式的壓縮檔');
      return;
    }
    setParsing(true);
    setParseError(null);
    setParsed(null);
    try {
      const result = await parseArchive(file, selectedCli);
      setParsed(result);
    } catch (e) {
      setParseError(e instanceof Error ? e.message : '解析失敗，請確認壓縮檔格式正確');
    } finally {
      setParsing(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  function handleContinue() {
    if (!parsed) return;

    setArchiveMode(selectedCli, parsed.files);

    // Pre-fill form fields from parsed metadata
    const meta = parsed.parsedMeta;
    const entryContent = parsed.entryFile?.content ?? '';
    const body = extractBody(entryContent);
    const fm = parseFrontmatter(entryContent);

    // Determine skill type
    if (parsed.detectedType) {
      setSkillType(parsed.detectedType.toLowerCase() as 'skill' | 'agent');
    }

    // Build attachedFiles: all non-entry files
    const entryPath = parsed.entryFile?.path ?? '';
    const attachedFiles = parsed.files
      .filter((f) => f.path !== entryPath)
      .map((f) => ({ filename: f.path, content: f.content }));

    // Auto-extract installation steps from frontmatter if present
    const installStepsRaw = fm['installation'] ?? fm['install'];
    const installationSteps = installStepsRaw
      ? installStepsRaw.split(';').map((s) => s.trim()).filter(Boolean)
      : [''];

    updateForm({
      name: meta.name ?? '',
      description: meta.description ?? '',
      version: meta.version ?? '1.0.0',
      tags: meta.tags ?? [],
      content: body,
      attachedFiles,
      installationSteps,
      sourceCliFormat: selectedCli,
    });

    router.push('/upload/archive?step=1');
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-1">上傳並解析壓縮包</h2>
        <p className="text-sm text-gray-500">選擇 ZIP 或 RAR 格式的 Skill 資料夾壓縮檔，平台將自動解析目錄結構與 metadata。</p>
      </div>

      {/* CLI Selection */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">此 ZIP 是為哪個 CLI 工具設計的？</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {CLI_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setSelectedCli(value)}
              className={clsx(
                'px-3 py-2 text-sm rounded-lg border-2 font-medium transition-colors',
                selectedCli === value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={clsx(
          'relative border-2 border-dashed rounded-xl p-8 text-center transition-colors',
          isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        )}
      >
        <input
          type="file"
          accept=".zip,.rar"
          onChange={handleFileInput}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
        <Upload size={32} className="mx-auto text-gray-400 mb-3" />
        <p className="text-sm font-medium text-gray-700">拖曳 ZIP / RAR 檔案到此 或 點擊選擇</p>
        <p className="text-xs text-gray-400 mt-1">支援 .zip / .rar 格式，最大 50MB</p>
        {parsing && (
          <p className="mt-3 text-sm text-blue-600 animate-pulse">解析中...</p>
        )}
      </div>

      {/* Parse Error */}
      {parseError && (
        <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{parseError}</span>
        </div>
      )}

      {/* Parse Result */}
      {parsed && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="flex flex-wrap gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm">
            <span className="text-green-800">
              解析完成：共 <strong>{parsed.files.length}</strong> 個文字檔
              {parsed.skippedBinaryCount > 0 && (
                <span className="text-orange-700">，跳過 {parsed.skippedBinaryCount} 個二進位檔</span>
              )}
            </span>
            {parsed.detectedType && (
              <span className="text-green-700">
                偵測到：<strong>{parsed.detectedType === 'SKILL' ? 'Skill（技能）' : 'Agent（代理人）'}</strong>
              </span>
            )}
            {parsed.parsedMeta.name && (
              <span className="text-green-700">名稱：<strong>{parsed.parsedMeta.name}</strong></span>
            )}
          </div>

          {/* File Tree */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">目錄結構預覽</p>
            <FileTreeViewer
              files={parsed.files}
              entryFilePath={parsed.entryFile?.path}
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleContinue}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              繼續填寫基本資訊 →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

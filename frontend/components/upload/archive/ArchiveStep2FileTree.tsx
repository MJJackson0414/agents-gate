'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUpload } from '@/lib/upload-context';
import FileTreeViewer from './FileTreeViewer';
import { Plus, Minus } from 'lucide-react';

const VAR_PATTERN = /\{([A-Z][A-Z0-9_]*)\}|\$([A-Z][A-Z0-9_]*)/g;

function detectVars(content: string): string[] {
  const found = new Set<string>();
  let match;
  while ((match = VAR_PATTERN.exec(content)) !== null) {
    found.add(match[1] ?? match[2]);
  }
  return Array.from(found);
}

export default function ArchiveStep2FileTree() {
  const router = useRouter();
  const { state, updateForm } = useUpload();
  const { formData } = state;

  const archiveFiles = formData.archiveFiles ?? [];
  const entryPath = (() => {
    const entry = archiveFiles.find(
      (f) => f.path.toLowerCase() === 'skill.md' || f.path.endsWith('.agent.md')
    );
    return entry?.path ?? archiveFiles[0]?.path ?? '';
  })();

  const [selectedPath, setSelectedPath] = useState(entryPath);
  const selectedFile = archiveFiles.find((f) => f.path === selectedPath);

  const entryContent = archiveFiles.find((f) => f.path === entryPath)?.content ?? '';
  const detectedVarNames = detectVars(entryContent);

  const variables = formData.variables ?? [];
  const installationSteps = formData.installationSteps ?? [''];

  function syncVars(names: string[]) {
    const existing = new Map(variables.map((v) => [v.name, v]));
    const synced = names.map((name) =>
      existing.get(name) ?? { name, description: '', example: '' }
    );
    updateForm({ variables: synced });
  }

  function setInstallStep(idx: number, value: string) {
    const steps = [...installationSteps];
    steps[idx] = value;
    updateForm({ installationSteps: steps });
  }

  function addInstallStep() {
    updateForm({ installationSteps: [...installationSteps, ''] });
  }

  function removeInstallStep(idx: number) {
    const steps = installationSteps.filter((_, i) => i !== idx);
    updateForm({ installationSteps: steps.length ? steps : [''] });
  }

  // Sync vars after mount (must be in useEffect, never in render body)
  useEffect(() => {
    if (detectedVarNames.length > 0 && variables.length === 0) {
      syncVars(detectedVarNames);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryPath]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-1">檔案結構</h2>
        <p className="text-sm text-gray-500">
          確認您的 ZIP 壓縮包中的檔案結構，點擊任一檔案可預覽內容。
        </p>
      </div>

      {archiveFiles.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">
          尚未上傳 ZIP 檔案，請返回步驟 0 重新上傳。
        </div>
      ) : (
        <>
          {/* File Tree + Preview */}
          <div className="space-y-3">
            <FileTreeViewer
              files={archiveFiles}
              entryFilePath={entryPath}
              selectedPath={selectedPath}
              onFileSelect={(path) => setSelectedPath(path)}
            />

            {selectedFile && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 bg-gray-100 border-b border-gray-200">
                  <span className="text-xs font-mono text-gray-600">{selectedFile.path}</span>
                  <span className="text-xs text-gray-400">{(selectedFile.size / 1024).toFixed(1)}KB</span>
                </div>
                <pre className="p-3 text-xs font-mono text-gray-700 overflow-auto max-h-48 whitespace-pre-wrap break-words">
                  {selectedFile.content.slice(0, 3000)}
                  {selectedFile.content.length > 3000 && '\n... (顯示前 3000 字元)'}
                </pre>
              </div>
            )}
          </div>

          {/* Detected Variables */}
          {detectedVarNames.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                偵測到的變數（來自主要入口檔）
              </p>
              <div className="space-y-2">
                {variables.map((v, idx) => (
                  <div key={v.name} className="grid grid-cols-3 gap-2 items-center">
                    <span className="text-xs font-mono bg-gray-100 px-2 py-1.5 rounded text-gray-700">
                      {`{${v.name}}`}
                    </span>
                    <input
                      type="text"
                      value={v.description}
                      onChange={(e) => {
                        const vars = [...variables];
                        vars[idx] = { ...v, description: e.target.value };
                        updateForm({ variables: vars });
                      }}
                      placeholder="說明"
                      className="text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-300"
                    />
                    <input
                      type="text"
                      value={v.example}
                      onChange={(e) => {
                        const vars = [...variables];
                        vars[idx] = { ...v, example: e.target.value };
                        updateForm({ variables: vars });
                      }}
                      placeholder="範例值"
                      className="text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-300"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Installation Steps */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">安裝步驟</p>
            <div className="space-y-2">
              {installationSteps.map((step, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <span className="mt-2 text-xs text-gray-400 w-4 shrink-0">{idx + 1}.</span>
                  <input
                    type="text"
                    value={step}
                    onChange={(e) => setInstallStep(idx, e.target.value)}
                    placeholder={`步驟 ${idx + 1}`}
                    className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                  {installationSteps.length > 1 && (
                    <button
                      onClick={() => removeInstallStep(idx)}
                      className="mt-1 p-1.5 text-red-400 hover:text-red-600 transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addInstallStep}
                className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 transition-colors"
              >
                <Plus size={14} />
                新增步驟
              </button>
            </div>
          </div>
        </>
      )}

      <div className="flex justify-between pt-4">
        <button
          onClick={() => router.push('/upload/archive?step=1')}
          className="px-5 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
        >
          ← 上一步
        </button>
        <button
          onClick={() => router.push('/upload/archive?step=3')}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          下一步：環境設定 →
        </button>
      </div>
    </div>
  );
}

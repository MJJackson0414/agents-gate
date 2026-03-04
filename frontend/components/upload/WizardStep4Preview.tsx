'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import { useUpload } from '@/lib/upload-context';
import { generateAdapters, CliTarget, getCliLabel } from '@/lib/cli-adapter';
import { uploadSkill } from '@/lib/api';
import { clsx } from 'clsx';
import { Copy, Check } from 'lucide-react';

const CLI_TABS: CliTarget[] = ['claude', 'copilot', 'gemini', 'kiro'];

interface ValidationIssue {
  field: string;
  message: string;
}

function clientValidate(formData: Record<string, unknown>): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!formData.name) issues.push({ field: 'name', message: '名稱為必填' });
  if (!formData.description) issues.push({ field: 'description', message: '描述為必填' });
  if (!formData.content) issues.push({ field: 'content', message: '核心指令內容為必填' });
  const steps = (formData.installationSteps as string[] | undefined) ?? [];
  if (steps.filter((s) => s.trim()).length === 0) {
    issues.push({ field: 'installationSteps', message: '至少需要一個安裝步驟' });
  }
  const tags = (formData.tags as string[] | undefined) ?? [];
  if (tags.length === 0) issues.push({ field: 'tags', message: '至少需要一個標籤' });
  return issues;
}

export default function WizardStep4Preview() {
  const router = useRouter();
  const params = useParams();
  const { state, setErrors, setSubmitting, reset } = useUpload();
  const { formData, type, isSubmitting } = state;

  const [activeTab, setActiveTab] = useState<CliTarget>('claude');
  const [copiedTab, setCopiedTab] = useState<CliTarget | null>(null);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; id?: string; error?: string } | null>(null);

  const adapters = type ? generateAdapters(formData, type) : [];
  const validationIssues = clientValidate(formData as Record<string, unknown>);
  const hasMcp = !!(formData.mcpSpec?.serverName);

  const activeAdapter = adapters.find((a) => a.target === activeTab);

  function copyContent(content: string, tab: CliTarget) {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedTab(tab);
      setTimeout(() => setCopiedTab(null), 2000);
    });
  }

  async function handleSubmit() {
    if (validationIssues.length > 0) {
      const errs = Object.fromEntries(validationIssues.map((i) => [i.field, i.message]));
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        type: type?.toUpperCase(),
        description: formData.description,
        content: formData.content,
        installationSteps: (formData.installationSteps ?? []).filter((s) => s.trim()),
        dependencies: (formData.dependencies ?? []).filter((d) => d.trim()),
        tags: formData.tags ?? [],
        version: formData.version,
        changelog: formData.changelog,
        osCompatibility: formData.osCompatibility ?? ['WINDOWS', 'MACOS'],
        authorName: formData.authorName,
        authorEmail: formData.authorEmail,
        environmentDeclaration: formData.environmentDeclaration,
        mcpSpec: formData.mcpSpec ?? null,
        cliOverrides: formData.cliOverrides ?? {},
      };

      const result = await uploadSkill(payload);

      if (result.success && result.data) {
        setSubmitResult({ success: true, id: result.data.id });
        reset();
      } else {
        const fieldErrors = result.meta?.fieldErrors;
        if (fieldErrors) setErrors(fieldErrors);
        setSubmitResult({ success: false, error: result.error ?? '上傳失敗' });
      }
    } catch {
      setSubmitResult({ success: false, error: '網路錯誤 — 請確認後端服務是否正在執行' });
    } finally {
      setSubmitting(false);
    }
  }

  if (submitResult?.success) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="text-5xl">🎉</div>
        <h2 className="text-2xl font-semibold text-gray-900">已提交審核！</h2>
        <p className="text-gray-500">
          您的 {type === 'skill' ? 'Skill（技能）' : 'Agent（代理人）'} 已提交。AI 審核完成後將通知您。
        </p>
        <p className="text-xs text-gray-400">ID：{submitResult.id}</p>
        <button
          onClick={() => router.push('/upload')}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
        >
          再次上傳
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-1">預覽與提交</h2>
        <p className="text-sm text-gray-500">提交前，請確認各 CLI 將產生的適配內容。</p>
      </div>

      {/* CLI 相容性橫幅 */}
      <div className="flex flex-wrap gap-2">
        {adapters.map((adapter) => (
          <span
            key={adapter.target}
            className={clsx(
              'px-3 py-1 text-sm rounded-full font-medium',
              adapter.supported
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-600 border border-red-200'
            )}
          >
            {adapter.supported ? '✅' : '❌'} {getCliLabel(adapter.target)}
          </span>
        ))}
      </div>

      {hasMcp && (
        <div className="text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
          ⚠️ 偵測到 MCP Server — 不會產生 Gemini CLI 適配檔案（不支援 MCP）。
        </div>
      )}

      {/* 適配檔案預覽 */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex border-b border-gray-200 bg-gray-50">
          {CLI_TABS.map((tab) => {
            const adapter = adapters.find((a) => a.target === tab);
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={clsx(
                  'px-4 py-2.5 text-sm font-medium transition-colors relative',
                  activeTab === tab
                    ? 'text-blue-600 bg-white border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700',
                  !adapter?.supported && 'opacity-50'
                )}
              >
                {getCliLabel(tab)}
                {!adapter?.supported && <span className="ml-1 text-red-400">✗</span>}
              </button>
            );
          })}
        </div>

        <div className="p-4 bg-white">
          {activeAdapter?.supported ? (
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400 font-mono">{activeAdapter.filename}</span>
                <button
                  onClick={() => copyContent(activeAdapter.content, activeTab)}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                >
                  {copiedTab === activeTab ? <Check size={12} /> : <Copy size={12} />}
                  {copiedTab === activeTab ? '已複製！' : '複製'}
                </button>
              </div>
              <pre className="text-xs font-mono bg-gray-50 p-4 rounded-lg overflow-auto max-h-60 whitespace-pre-wrap text-gray-700">
                {activeAdapter.content}
              </pre>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-400">
              <p className="text-sm">❌ {activeAdapter?.unsupportedReason}</p>
            </div>
          )}
        </div>
      </div>

      {/* 格式檢查 */}
      <div className={clsx(
        'px-4 py-3 rounded-lg text-sm border',
        validationIssues.length === 0
          ? 'bg-green-50 border-green-200 text-green-700'
          : 'bg-red-50 border-red-200 text-red-700'
      )}>
        {validationIssues.length === 0 ? (
          <span>✅ 格式檢查通過 — 所有必填欄位均已完整填寫。</span>
        ) : (
          <div>
            <p className="font-medium mb-1">⚠️ 發現問題 — 請修正後再提交：</p>
            <ul className="list-disc list-inside space-y-0.5">
              {validationIssues.map((issue) => (
                <li key={issue.field}>{issue.message}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {submitResult?.error && (
        <div className="px-4 py-3 rounded-lg text-sm bg-red-50 border border-red-200 text-red-700">
          ❌ {submitResult.error}
        </div>
      )}

      <div className="flex justify-between pt-4">
        <button
          onClick={() => {
            router.push(`/upload/${params.type}?step=3`);
          }}
          className="px-6 py-2 border border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          ← 上一步
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || validationIssues.length > 0}
          className={clsx(
            'px-6 py-2 rounded-lg font-medium transition-colors',
            isSubmitting || validationIssues.length > 0
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          )}
        >
          {isSubmitting ? '提交中...' : '提交審核 →'}
        </button>
      </div>
    </div>
  );
}

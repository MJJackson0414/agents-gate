'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUpload } from '@/lib/upload-context';
import { uploadSkill, fetchSkillById, SkillDetailResponse, SkillReviewResult } from '@/lib/api';
import { clsx } from 'clsx';

const CLI_LABELS: Record<string, string> = {
  CLAUDE:  'Claude Code',
  COPILOT: 'GitHub Copilot',
  GEMINI:  'Gemini CLI',
  KIRO:    'Kiro',
};

const CLI_ORDER = ['CLAUDE', 'COPILOT', 'GEMINI', 'KIRO'];

const TERMINAL_STATUSES = ['PENDING_HUMAN_REVIEW', 'PUBLISHED', 'REJECTED', 'AI_REJECTED_REVIEW'];

const STATUS_LABEL: Record<string, { label: string; color: string; icon: string }> = {
  DRAFT:                { label: '草稿',        color: 'text-gray-500',   icon: '⏳' },
  PENDING_AI_REVIEW:    { label: 'AI 審核中',   color: 'text-blue-600',   icon: '🤖' },
  PENDING_HUMAN_REVIEW: { label: '等待人工審核', color: 'text-yellow-600', icon: '👀' },
  AI_REJECTED_REVIEW:   { label: 'AI 建議退回', color: 'text-orange-600', icon: '⚠️' },
  PUBLISHED:            { label: '已發布',      color: 'text-green-600',  icon: '✅' },
  REJECTED:             { label: '已退回',      color: 'text-red-600',    icon: '❌' },
};

function parseFeedback(raw: string | null): SkillReviewResult | null {
  if (!raw) return null;
  try { return JSON.parse(raw) as SkillReviewResult; } catch { return null; }
}

function ReviewStatusCard({ skillId }: { skillId: string }) {
  const [skill, setSkill] = useState<SkillDetailResponse | null>(null);
  const [pollError, setPollError] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetchSkillById(skillId);
        if (res.success && res.data) {
          setSkill(res.data);
          if (TERMINAL_STATUSES.includes(res.data.status)) {
            if (pollRef.current) clearInterval(pollRef.current);
          }
        }
      } catch {
        setPollError(true);
        if (pollRef.current) clearInterval(pollRef.current);
      }
    };
    poll();
    pollRef.current = setInterval(poll, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [skillId]);

  const statusInfo = skill ? (STATUS_LABEL[skill.status] ?? STATUS_LABEL['DRAFT']) : STATUS_LABEL['DRAFT'];
  const isPolling = !skill || !TERMINAL_STATUSES.includes(skill.status);
  const feedback = skill ? parseFeedback(skill.reviewFeedback) : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{statusInfo.icon}</span>
        <div>
          <p className={clsx('font-semibold', statusInfo.color)}>{statusInfo.label}</p>
          {isPolling && !pollError && (
            <p className="text-xs text-gray-400 mt-0.5 animate-pulse">正在等待審核結果...</p>
          )}
          {pollError && <p className="text-xs text-red-400 mt-0.5">無法取得狀態，請稍後至首頁查看</p>}
        </div>
        {isPolling && !pollError && (
          <div className="ml-auto w-4 h-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
        )}
      </div>

      {feedback && (
        <div className="space-y-3 pt-2 border-t border-gray-100">
          {feedback.userExplanation && (
            <p className="text-sm text-gray-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 leading-relaxed">
              <span className="font-semibold text-amber-800">📋 審核說明：</span>{feedback.userExplanation}
            </p>
          )}
          {feedback.issues.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <p className="text-xs font-semibold text-red-700 mb-1">⚠ 需要修正的問題：</p>
              <ul className="list-disc list-inside space-y-0.5">
                {feedback.issues.map((issue, i) => (
                  <li key={i} className="text-xs text-red-600">{issue}</li>
                ))}
              </ul>
            </div>
          )}
          {feedback.suggestions.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
              <p className="text-xs font-semibold text-blue-700 mb-1">💡 建議改善：</p>
              <ul className="list-disc list-inside space-y-0.5">
                {feedback.suggestions.map((s, i) => (
                  <li key={i} className="text-xs text-blue-600">{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function clientValidate(formData: Record<string, unknown>): string[] {
  const issues: string[] = [];
  if (!formData.name) issues.push('名稱為必填');
  if (!formData.description) issues.push('描述為必填');
  if (!formData.content) issues.push('主要入口檔內容為空，請確認 ZIP 結構正確');
  const steps = (formData.installationSteps as string[] | undefined) ?? [];
  if (steps.filter((s) => s.trim()).length === 0) issues.push('至少需要一個安裝步驟');
  const tags = (formData.tags as string[] | undefined) ?? [];
  if (tags.length === 0) issues.push('至少需要一個標籤');
  return issues;
}

export default function ArchiveStep4Preview() {
  const router = useRouter();
  const { state, setErrors, setSubmitting, reset } = useUpload();
  const { formData, type, isSubmitting } = state;

  const [submitResult, setSubmitResult] = useState<{ success: boolean; id?: string; error?: string } | null>(null);

  const sourceCliFormat = formData.sourceCliFormat ?? 'CLAUDE';
  const archiveFiles = formData.archiveFiles ?? [];
  const validationIssues = clientValidate(formData as Record<string, unknown>);

  async function handleSubmit() {
    if (validationIssues.length > 0) {
      const errs = Object.fromEntries(
        validationIssues.map((msg) => [msg, msg])
      );
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        type: type?.toUpperCase() ?? 'SKILL',
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
        cliOverrides: {},
        variables: formData.variables ?? [],
        attachedFiles: formData.attachedFiles ?? [],
        sourceCliFormat,
      };

      const result = await uploadSkill(payload);

      if (result.success && result.data) {
        reset();
        setSubmitResult({ success: true, id: result.data.id });
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

  if (submitResult?.success && submitResult.id) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-1">上傳成功！</h2>
          <p className="text-sm text-gray-500">您的 Skill 已提交，AI 正在進行初步審核。</p>
        </div>
        <div className="border border-gray-200 rounded-xl p-5">
          <ReviewStatusCard skillId={submitResult.id} />
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/')}
            className="px-5 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            返回首頁
          </button>
          <button
            onClick={() => router.push(`/skills/${submitResult.id}`)}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            查看詳情 →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-1">預覽與提交</h2>
        <p className="text-sm text-gray-500">確認以下資訊後送出審核。</p>
      </div>

      {/* CLI Compatibility */}
      <div className="border border-gray-200 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">CLI 相容性</h3>
        <div className="space-y-2">
          {CLI_ORDER.map((cli) => {
            const isSupported = cli === sourceCliFormat;
            return (
              <div key={cli} className="flex items-center gap-2">
                <span className={clsx('text-sm', isSupported ? 'text-green-600' : 'text-red-400')}>
                  {isSupported ? '✓' : '✗'}
                </span>
                <span className={clsx('text-sm', isSupported ? 'text-gray-800 font-medium' : 'text-gray-400')}>
                  {CLI_LABELS[cli]}
                </span>
                {!isSupported && (
                  <span className="text-xs text-gray-400">
                    （此 Skill 為 {CLI_LABELS[sourceCliFormat]} 專屬格式）
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Files Summary */}
      <div className="border border-gray-200 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">將上傳的檔案結構</h3>
        {archiveFiles.length === 0 ? (
          <p className="text-sm text-gray-400">（無附加檔案）</p>
        ) : (
          <div className="space-y-1">
            {archiveFiles.slice(0, 15).map((f) => (
              <div key={f.path} className="flex items-center gap-2 text-xs text-gray-600">
                <span className="text-gray-400">📄</span>
                <span className="font-mono">{f.path}</span>
              </div>
            ))}
            {archiveFiles.length > 15 && (
              <p className="text-xs text-gray-400">...以及其他 {archiveFiles.length - 15} 個檔案</p>
            )}
            <p className="text-xs text-gray-500 pt-1">共 {archiveFiles.length} 個檔案</p>
          </div>
        )}
      </div>

      {/* Basic Info Summary */}
      <div className="border border-gray-200 rounded-xl p-5 space-y-2 text-sm">
        <h3 className="font-semibold text-gray-700 mb-3">提交資訊</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <span className="text-gray-500">名稱</span>
          <span className="font-mono text-gray-800">{formData.name || '(未填)'}</span>
          <span className="text-gray-500">類型</span>
          <span className="text-gray-800">{type === 'skill' ? 'Skill（技能）' : 'Agent（代理人）'}</span>
          <span className="text-gray-500">版本</span>
          <span className="text-gray-800">{formData.version || '1.0.0'}</span>
          <span className="text-gray-500">標籤</span>
          <span className="text-gray-800">{(formData.tags ?? []).join(', ') || '(無)'}</span>
          <span className="text-gray-500">作者</span>
          <span className="text-gray-800">{formData.authorName || '(未填)'}</span>
        </div>
      </div>

      {/* Validation Issues */}
      {validationIssues.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <p className="text-sm font-semibold text-red-700 mb-1">請先補全以下欄位：</p>
          <ul className="list-disc list-inside space-y-0.5">
            {validationIssues.map((issue, i) => (
              <li key={i} className="text-xs text-red-600">{issue}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Submit Error */}
      {submitResult?.success === false && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {submitResult.error}
        </div>
      )}

      <div className="flex justify-between pt-4">
        <button
          onClick={() => router.push('/upload/archive?step=3')}
          className="px-5 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
        >
          ← 上一步
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || validationIssues.length > 0}
          className={clsx(
            'px-6 py-2 rounded-lg font-medium text-sm transition-colors',
            isSubmitting || validationIssues.length > 0
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          )}
        >
          {isSubmitting ? '送出中...' : '提交審核'}
        </button>
      </div>
    </div>
  );
}

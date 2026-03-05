'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';
import { SkillResponse, SkillReviewResult, SkillDetailResponse, fetchSkillById } from '@/lib/api';

const UPLOAD_DRAFT_KEY = 'agentsgate-upload-draft';

function parseReviewFeedback(raw: string | null): SkillReviewResult | null {
  if (!raw) return null;
  try { return JSON.parse(raw) as SkillReviewResult; } catch { return null; }
}

function buildDraftFromDetail(detail: SkillDetailResponse) {
  const env = detail.environmentDeclaration;
  return {
    type: detail.type.toLowerCase() as 'skill' | 'agent',
    step: 1,
    formData: {
      name: detail.name,
      description: detail.description,
      version: detail.version,
      changelog: detail.changelog ?? '',
      tags: detail.tags ?? [],
      authorName: detail.authorName ?? '',
      authorEmail: detail.authorEmail ?? '',
      content: detail.content ?? '',
      installationSteps: detail.installationSteps?.length ? detail.installationSteps : [''],
      dependencies: detail.dependencies ?? [],
      osCompatibility: detail.osCompatibility ?? ['WINDOWS', 'MACOS'],
      environmentDeclaration: {
        requiresInternet: env?.requiresInternet ?? false,
        requiresMcpServer: env?.requiresMcpServer ?? false,
        requiresLocalService: env?.requiresLocalService ?? false,
        requiresSystemPackages: env?.requiresSystemPackages ?? false,
        additionalNotes: env?.additionalNotes ?? '',
      },
      mcpSpec: detail.mcpSpec
        ? {
            serverName: detail.mcpSpec.serverName,
            command: detail.mcpSpec.command,
            args: detail.mcpSpec.args ?? [],
            env: detail.mcpSpec.env ?? {},
          }
        : null,
      cliOverrides: detail.cliOverrides ?? {},
    },
  };
}

const PAGE_SIZE = 30;
type TypeFilter = 'ALL' | 'SKILL' | 'AGENT';

const STATUS_LABEL: Record<string, string> = {
  PUBLISHED: '已發布',
  DRAFT: '草稿',
  PENDING_AI_REVIEW: 'AI 審核中',
  PENDING_HUMAN_REVIEW: '人工審核中',
  REJECTED: '已退回',
};

const TYPE_FILTER_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: 'ALL', label: '全部' },
  { value: 'SKILL', label: 'Skill' },
  { value: 'AGENT', label: 'Agent' },
];

export default function SkillExplorer({ initialSkills }: { initialSkills: SkillResponse[] }) {
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState<TypeFilter>('ALL');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return initialSkills.filter((s) => {
      if (activeType !== 'ALL' && s.type !== activeType) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        (s.tags ?? []).some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [initialSkills, search, activeType]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function handleSearch(value: string) {
    setSearch(value);
    setPage(0);
  }

  function handleType(type: TypeFilter) {
    setActiveType(type);
    setPage(0);
  }

  return (
    <div>
      {/* Search + Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="搜尋名稱、描述或標籤..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
          />
        </div>
        <div className="flex gap-2 shrink-0">
          {TYPE_FILTER_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleType(value)}
              className={clsx(
                'px-4 py-2 text-sm rounded-lg font-medium transition-colors',
                activeType === value
                  ? value === 'SKILL'
                    ? 'bg-blue-600 text-white'
                    : value === 'AGENT'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-white'
                  : 'border border-gray-200 text-gray-600 hover:bg-gray-50 bg-white'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Result summary */}
      <p className="text-sm text-gray-400 mb-4">
        共 {filtered.length} 個結果
        {totalPages > 1 && `，第 ${page + 1} / ${totalPages} 頁`}
      </p>

      {/* Grid */}
      {paged.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg mb-1">找不到符合條件的結果</p>
          <p className="text-sm">請嘗試其他關鍵字或清除篩選條件</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paged.map((skill) => (
            <SkillCard key={skill.id} skill={skill} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className={clsx(
              'px-4 py-2 text-sm rounded-lg border transition-colors',
              page === 0
                ? 'border-gray-100 text-gray-300 cursor-not-allowed bg-white'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50 bg-white'
            )}
          >
            ← 上一頁
          </button>
          <span className="text-sm text-gray-500">{page + 1} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className={clsx(
              'px-4 py-2 text-sm rounded-lg border transition-colors',
              page === totalPages - 1
                ? 'border-gray-100 text-gray-300 cursor-not-allowed bg-white'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50 bg-white'
            )}
          >
            下一頁 →
          </button>
        </div>
      )}
    </div>
  );
}

function SkillCard({ skill }: { skill: SkillResponse }) {
  const router = useRouter();
  const isAgent = skill.type === 'AGENT';
  const isRejected = skill.status === 'REJECTED';
  const [showDetail, setShowDetail] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const feedback = parseReviewFeedback(skill.reviewFeedback ?? null);

  async function handleRetry() {
    setRetrying(true);
    try {
      const res = await fetchSkillById(skill.id);
      if (res.success && res.data) {
        const draft = buildDraftFromDetail(res.data);
        localStorage.setItem(UPLOAD_DRAFT_KEY, JSON.stringify(draft));
        router.push(`/upload/${draft.type}?step=1`);
      }
    } catch {
      setRetrying(false);
    }
  }

  return (
    <div className={clsx(
      'bg-white border rounded-xl p-5 transition-shadow flex flex-col gap-3',
      isRejected ? 'border-red-200 hover:shadow-md' : 'border-gray-200 hover:shadow-md'
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="font-mono text-sm font-semibold text-gray-900 break-all">{skill.name}</span>
          <div className="flex items-center gap-2 mt-1">
            <span className={clsx(
              'text-xs px-1.5 py-0.5 rounded font-medium',
              isAgent ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
            )}>
              {isAgent ? 'Agent' : 'Skill'}
            </span>
            <span className="text-xs text-gray-400">v{skill.version}</span>
          </div>
        </div>
        <span className={clsx(
          'shrink-0 text-xs px-2 py-0.5 rounded-full font-medium',
          skill.status === 'PUBLISHED' ? 'bg-green-50 text-green-700' :
          isRejected ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'
        )}>
          {STATUS_LABEL[skill.status] ?? skill.status}
        </span>
      </div>

      <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">{skill.description}</p>

      {skill.tags && skill.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {skill.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded">
              {tag}
            </span>
          ))}
          {skill.tags.length > 4 && (
            <span className="text-xs text-gray-400">+{skill.tags.length - 4}</span>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 pt-1 border-t border-gray-100 flex-wrap">
        <span className="text-xs text-gray-400">CLI：</span>
        {['Claude Code', 'Copilot', 'Gemini', 'Kiro'].map((cli) => {
          const blocked = skill.hasMcpSpec && (cli === 'Gemini' || cli === 'Kiro');
          return (
            <span key={cli} className={clsx('text-xs', blocked ? 'text-red-400 line-through' : 'text-green-600')}>
              {blocked ? '✗' : '✓'} {cli}
            </span>
          );
        })}
      </div>

      {/* Rejection detail section */}
      {isRejected && feedback && (
        <div className="border-t border-red-100 pt-3 space-y-2">
          <button
            onClick={() => setShowDetail((v) => !v)}
            className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium"
          >
            {showDetail ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {showDetail ? '收起退回原因' : '查看退回原因'}
          </button>

          {showDetail && (
            <div className="space-y-2">
              {feedback.userExplanation && (
                <p className="text-xs text-gray-800 bg-amber-50 border border-amber-200 rounded px-2.5 py-2 leading-relaxed">
                  <span className="font-semibold text-amber-800">📋 退回說明：</span>{feedback.userExplanation}
                </p>
              )}
              {feedback.issues.length > 0 && (
                <div className="bg-red-50 rounded px-2.5 py-2">
                  <p className="text-xs font-semibold text-red-700 mb-1">需要修正的問題：</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {feedback.issues.map((issue, i) => (
                      <li key={i} className="text-xs text-red-600">{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
              {feedback.suggestions.length > 0 && (
                <div className="bg-blue-50 rounded px-2.5 py-2">
                  <p className="text-xs font-semibold text-blue-700 mb-1">建議改善：</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {feedback.suggestions.map((s, i) => (
                      <li key={i} className="text-xs text-blue-600">{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleRetry}
            disabled={retrying}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw size={11} className={retrying ? 'animate-spin' : ''} />
            {retrying ? '載入中...' : '修改後重新上傳'}
          </button>
        </div>
      )}
    </div>
  );
}

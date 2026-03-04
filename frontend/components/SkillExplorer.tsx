'use client';

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { clsx } from 'clsx';
import { SkillResponse } from '@/lib/api';

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
  const isAgent = skill.type === 'AGENT';
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col gap-3">
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
          'shrink-0 text-xs px-2 py-0.5 rounded-full',
          skill.status === 'PUBLISHED' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
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
    </div>
  );
}

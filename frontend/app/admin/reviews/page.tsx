'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, ArrowLeft, RefreshCw, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import {
  AdminReviewItem,
  getAdminToken,
  clearAdminToken,
  fetchPendingReviews,
  fetchPublishedSkills,
  approveReview,
  rejectReview,
  deleteSkill,
} from '@/lib/adminApi';

type FilterTab = 'ALL' | 'AI_PASSED' | 'AI_REJECTED' | 'PUBLISHED';

export default function AdminReviewsPage() {
  const router = useRouter();
  const [items, setItems] = useState<AdminReviewItem[]>([]);
  const [publishedItems, setPublishedItems] = useState<AdminReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const [reviewRes, publishedRes] = await Promise.all([
        fetchPendingReviews(),
        fetchPublishedSkills(),
      ]);
      if (reviewRes.success && reviewRes.data) setItems(reviewRes.data);
      if (publishedRes.success && publishedRes.data) setPublishedItems(publishedRes.data);
    } catch {
      // network error; 401 is handled inside adminFetch (auto-redirect)
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!getAdminToken()) {
      router.replace('/');
      return;
    }
    loadReviews();
  }, [loadReviews, router]);

  const handleApprove = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    if (!confirm(`確定要通過發布「${item.name}」？`)) return;
    setActionLoading(id);
    try {
      const res = await approveReview(id);
      if (res.success) {
        setItems(prev => prev.filter(i => i.id !== id));

        let packageName = item.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
        if (!packageName) packageName = 'agent-skill';

        const baseUrl = process.env.NEXT_PUBLIC_NEXUS_URL || 'http://192.168.64.7:8081/#browse/browse:npm-hosted:';
        const nexusUrl = `${baseUrl}${packageName}`;

        setTimeout(() => {
          if (confirm(`✅ 發布審核通過！\n\n系統正在將套件推送到 Nexus。\n是否要開啟新分頁前往 Nexus 查看 ${packageName}？`)) {
            window.open(nexusUrl, '_blank');
          }
        }, 100); // 稍微延遲讓狀態先更新
      } else {
        alert(res.error ?? '操作失敗');
      }
    } catch {
      alert('連線失敗');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('確定要拒絕此項目？')) return;
    setActionLoading(id);
    try {
      const res = await rejectReview(id);
      if (res.success) {
        setItems(prev => prev.filter(item => item.id !== id));
      } else {
        alert(res.error ?? '操作失敗');
      }
    } catch {
      alert('連線失敗');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除此項目？此操作無法復原。')) return;
    setActionLoading(id);
    try {
      const res = await deleteSkill(id);
      if (res.success) {
        setPublishedItems(prev => prev.filter(item => item.id !== id));
      } else {
        alert(res.error ?? '刪除失敗');
      }
    } catch {
      alert('連線失敗');
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = () => {
    clearAdminToken();
    router.replace('/');
  };

  const filteredItems = items.filter(item => {
    if (activeTab === 'AI_PASSED') return item.status === 'PENDING_HUMAN_REVIEW';
    if (activeTab === 'AI_REJECTED') return item.status === 'AI_REJECTED_REVIEW';
    return true;
  });

  const aiPassedCount = items.filter(i => i.status === 'PENDING_HUMAN_REVIEW').length;
  const aiRejectedCount = items.filter(i => i.status === 'AI_REJECTED_REVIEW').length;

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'ALL', label: `全部 (${items.length})` },
    { key: 'AI_PASSED', label: `AI 通過待審 (${aiPassedCount})` },
    { key: 'AI_REJECTED', label: `AI 拒絕待複審 (${aiRejectedCount})` },
    { key: 'PUBLISHED', label: `已通過 (${publishedItems.length})` },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">案件審查後台</h1>
              <p className="text-xs text-gray-400">審核待發布的 Skill 與 Agent</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadReviews}
              disabled={loading}
              title="重新整理"
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <RefreshCw size={16} className={clsx(loading && 'animate-spin')} />
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              登出
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={clsx(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                activeTab === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="text-center py-20 text-gray-400 text-sm">載入中...</div>
        )}

        {!loading && activeTab !== 'PUBLISHED' && filteredItems.length === 0 && (
          <div className="text-center py-20 text-gray-400 text-sm">目前沒有待審核的項目</div>
        )}

        {!loading && activeTab === 'PUBLISHED' && publishedItems.length === 0 && (
          <div className="text-center py-20 text-gray-400 text-sm">目前沒有已發布的項目</div>
        )}

        {!loading && activeTab !== 'PUBLISHED' && (
          <div className="space-y-4">
            {filteredItems.map(item => (
              <ReviewCard
                key={item.id}
                item={item}
                expanded={expandedId === item.id}
                onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
                onApprove={() => handleApprove(item.id)}
                onReject={() => handleReject(item.id)}
                actionLoading={actionLoading === item.id}
              />
            ))}
          </div>
        )}

        {!loading && activeTab === 'PUBLISHED' && (
          <div className="space-y-4">
            {publishedItems.map(item => (
              <PublishedCard
                key={item.id}
                item={item}
                onDelete={() => handleDelete(item.id)}
                actionLoading={actionLoading === item.id}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// --- PublishedCard ---

interface PublishedCardProps {
  item: AdminReviewItem;
  onDelete: () => void;
  actionLoading: boolean;
}

function PublishedCard({ item, onDelete, actionLoading }: PublishedCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-semibold text-gray-900">{item.name}</h3>
            <span className={clsx(
              'px-2 py-0.5 rounded text-xs font-medium',
              item.type === 'SKILL' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
            )}>
              {item.type}
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700">
              已發布
            </span>
          </div>
          <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
            <span>{item.authorName}</span>
            <span>{item.authorEmail}</span>
            <span>v{item.version}</span>
            <span>{new Date(item.createdAt).toLocaleDateString('zh-TW')}</span>
          </div>
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {item.tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={onDelete}
          disabled={actionLoading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          <Trash2 size={14} />
          刪除
        </button>
      </div>
    </div>
  );
}

// --- ReviewCard ---

interface ReviewCardProps {
  item: AdminReviewItem;
  expanded: boolean;
  onToggle: () => void;
  onApprove: () => void;
  onReject: () => void;
  actionLoading: boolean;
}

function ReviewCard({ item, expanded, onToggle, onApprove, onReject, actionLoading }: ReviewCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Name + badges */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-semibold text-gray-900">{item.name}</h3>
            <span className={clsx(
              'px-2 py-0.5 rounded text-xs font-medium',
              item.type === 'SKILL' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
            )}>
              {item.type}
            </span>
            <span className={clsx(
              'px-2 py-0.5 rounded text-xs font-medium',
              item.aiReviewPassed ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            )}>
              {item.aiReviewPassed ? 'AI 初審通過' : 'AI 初審不通過'}
            </span>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>

          {/* Meta */}
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
            <span>{item.authorName}</span>
            <span>{item.authorEmail}</span>
            <span>v{item.version}</span>
            <span>{new Date(item.createdAt).toLocaleDateString('zh-TW')}</span>
          </div>

          {/* Tags */}
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {item.tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onApprove}
            disabled={actionLoading}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            通過發布
          </button>
          <button
            onClick={onReject}
            disabled={actionLoading}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            拒絕
          </button>
        </div>
      </div>

      {/* AI review expandable section */}
      {item.aiReviewSummary && (
        <div className="mt-3 border-t border-gray-100 pt-3">
          <button
            onClick={onToggle}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            AI 審查詳情
          </button>

          {expanded && (
            <div className="mt-3 space-y-3 text-sm">
              <div>
                <p className="font-medium text-gray-700 mb-1">摘要</p>
                <p className="text-gray-600">{item.aiReviewSummary}</p>
              </div>

              {item.aiReviewUserExplanation && (
                <div>
                  <p className="font-medium text-gray-700 mb-1">使用者說明</p>
                  <p className="text-gray-600">{item.aiReviewUserExplanation}</p>
                </div>
              )}

              {item.aiReviewIssues.length > 0 && (
                <div>
                  <p className="font-medium text-red-700 mb-1">問題</p>
                  <ul className="list-disc list-inside space-y-1">
                    {item.aiReviewIssues.map((issue, i) => (
                      <li key={i} className="text-red-600">{issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              {item.aiReviewSuggestions.length > 0 && (
                <div>
                  <p className="font-medium text-amber-700 mb-1">建議</p>
                  <ul className="list-disc list-inside space-y-1">
                    {item.aiReviewSuggestions.map((s, i) => (
                      <li key={i} className="text-amber-600">{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

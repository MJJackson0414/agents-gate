'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Wrench, Bot, ChevronDown, ChevronUp, Lightbulb, ArrowLeft, FolderArchive } from 'lucide-react';
import { clsx } from 'clsx';
import { useUpload, SkillType } from '@/lib/upload-context';

const CLI_BADGES = {
  skill: [
    { name: 'Claude Code', supported: true },
    { name: 'GitHub Copilot', supported: true },
    { name: 'Gemini CLI', supported: true },
    { name: 'Kiro', supported: true },
  ],
  agent: [
    { name: 'Claude Code', supported: true },
    { name: 'GitHub Copilot', supported: true },
    { name: 'Gemini CLI', supported: false },
    { name: 'Kiro', supported: false },
  ],
};

const COMPARISON_ROWS = [
  {
    label: '開放標準',
    skill: 'AgentSkills SKILL.md（Claude + Copilot 共用）',
    agent: 'CLI 專屬，無統一標準',
  },
  {
    label: '呼叫方式',
    skill: '/指令 方式（如 /commit）',
    agent: '角色對話（如「以架構師角色…」）',
  },
  {
    label: '個性設定',
    skill: '任務導向，無角色設定',
    agent: '具備明確角色與個性',
  },
  {
    label: '審核嚴格度',
    skill: '標準審核',
    agent: '較嚴格（角色與個性需經過審核）',
  },
];

function detectTypeFromContent(text: string): SkillType | null {
  if (/tools:\s*\[/.test(text) || /^tools:/m.test(text)) return 'agent';
  if (/^name:\s*\S/m.test(text) && /^description:\s*\S/m.test(text)) return 'skill';
  return null;
}

export default function TypeDecisionCard() {
  const router = useRouter();
  const { setSkillType } = useUpload();
  const [showComparison, setShowComparison] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<SkillType | null>(null);
  const [pasteValue, setPasteValue] = useState('');

  function handleSelect(type: SkillType) {
    setSkillType(type);
    router.push(`/upload/${type}?step=1`);
  }

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const text = e.clipboardData.getData('text');
    const detected = detectTypeFromContent(text);
    setAiSuggestion(detected);
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-blue-500 transition-colors"
        >
          <ArrowLeft size={14} />
          回到首頁
        </Link>
      </div>
      <h1 className="text-3xl font-bold text-center mb-2 text-blue-400">
        上傳至 AgentsGate
      </h1>
      <p className="text-center text-gray-500 mb-10">
        上傳一次，自動適配所有 CLI 工具。
      </p>

      {/* 類型卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <TypeCard
          type="skill"
          icon={<Wrench size={32} className="text-blue-600" />}
          title="Skill（技能）"
          subtitle="執行特定任務的指令"
          examples={['/commit', '/code-review', '/explain']}
          badges={CLI_BADGES.skill}
          onSelect={() => handleSelect('skill')}
        />
        <TypeCard
          type="agent"
          icon={<Bot size={32} className="text-purple-600" />}
          title="Agent（代理人）"
          subtitle="具備明確角色與個性的 AI"
          examples={['架構師 Agent', 'PM Agent', '程式碼審查 Agent']}
          badges={CLI_BADGES.agent}
          onSelect={() => handleSelect('agent')}
        />
      </div>

      {/* ZIP 壓縮包上傳 */}
      <button
        onClick={() => router.push('/upload/archive?step=0')}
        className="w-full border-2 border-dashed border-gray-300 hover:border-orange-400 rounded-xl p-5 mb-8 transition-all hover:shadow-md bg-white group text-left"
      >
        <div className="flex items-center gap-4">
          <div className="shrink-0 w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center">
            <FolderArchive size={24} className="text-orange-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-base font-semibold text-gray-900">ZIP 壓縮包上傳</span>
              <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded-full font-medium">進階</span>
            </div>
            <p className="text-sm text-gray-500">
              已有完整的 Skill 資料夾（含子目錄）？直接上傳 ZIP 或 RAR，自動解析目錄結構與 metadata。
            </p>
          </div>
          <span className="text-sm font-medium text-orange-500 group-hover:underline shrink-0">
            選擇 →
          </span>
        </div>
      </button>

      {/* AI 建議提示 */}
      {aiSuggestion && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          <Lightbulb size={16} />
          <span>
            根據您貼上的內容，這看起來像是一個{' '}
            <strong>{aiSuggestion === 'skill' ? 'Skill（技能）' : 'Agent（代理人）'}</strong>。
          </span>
          <button
            onClick={() => handleSelect(aiSuggestion)}
            className="ml-auto text-yellow-700 underline font-medium hover:text-yellow-900"
          >
            採用建議
          </button>
        </div>
      )}

      {/* 貼上區域 */}
      <div className="mb-6">
        <p className="text-sm text-gray-500 mb-2">
          已有 SKILL.md 或 agent 檔案？貼上後自動偵測類型：
        </p>
        <textarea
          className="w-full h-24 px-3 py-2 text-sm font-mono text-gray-900 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 bg-gray-50"
          placeholder="將您的 SKILL.md 內容貼在此處..."
          value={pasteValue}
          onChange={(e) => setPasteValue(e.target.value)}
          onPaste={handlePaste}
        />
      </div>

      {/* 不確定選哪個？ */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          onClick={() => setShowComparison((v) => !v)}
        >
          <span>❓ 不確定要選哪個類型？</span>
          {showComparison ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showComparison && (
          <div className="px-4 pb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="py-2 font-medium w-1/4"></th>
                  <th className="py-2 font-medium text-blue-600">Skill</th>
                  <th className="py-2 font-medium text-purple-600">Agent</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.label} className="border-b border-gray-50 last:border-0">
                    <td className="py-2 text-gray-700 font-medium pr-4">{row.label}</td>
                    <td className="py-2 text-gray-700 pr-4">{row.skill}</td>
                    <td className="py-2 text-gray-700">{row.agent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

interface TypeCardProps {
  type: SkillType;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  examples: string[];
  badges: { name: string; supported: boolean }[];
  onSelect: () => void;
}

function TypeCard({ icon, title, subtitle, examples, badges, onSelect }: TypeCardProps) {
  return (
    <button
      onClick={onSelect}
      className={clsx(
        'text-left w-full border-2 rounded-xl p-6 transition-all hover:shadow-md',
        'border-gray-200 hover:border-blue-300 bg-white group'
      )}
    >
      <div className="flex items-center gap-3 mb-3">
        {icon}
        <div>
          <div className="text-xl font-semibold text-gray-900">{title}</div>
          <div className="text-sm text-gray-500">{subtitle}</div>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">範例</div>
        <div className="flex flex-wrap gap-1">
          {examples.map((ex) => (
            <span
              key={ex}
              className="px-2 py-0.5 text-xs bg-gray-100 rounded font-mono text-gray-600"
            >
              {ex}
            </span>
          ))}
        </div>
      </div>

      <div>
        <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">CLI 支援</div>
        <div className="flex flex-wrap gap-1">
          {badges.map((b) => (
            <span
              key={b.name}
              className={clsx(
                'px-2 py-0.5 text-xs rounded',
                b.supported
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-600 line-through'
              )}
            >
              {b.supported ? '✓' : '✗'} {b.name}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100">
        <span className="text-sm font-medium text-blue-600 group-hover:underline">
          選擇 {title} →
        </span>
      </div>
    </button>
  );
}

import Link from 'next/link';
import { fetchSkills, SkillResponse } from '@/lib/api';

const TYPE_LABEL: Record<string, string> = {
  SKILL: 'Skill',
  AGENT: 'Agent',
};

const STATUS_LABEL: Record<string, string> = {
  PUBLISHED: '已發布',
  DRAFT: '草稿',
  PENDING_AI_REVIEW: 'AI 審核中',
  PENDING_HUMAN_REVIEW: '人工審核中',
  REJECTED: '已退回',
};

async function getSkills(): Promise<SkillResponse[]> {
  try {
    const res = await fetchSkills();
    return res.success && res.data ? res.data : [];
  } catch {
    return [];
  }
}

export default async function Home() {
  const skills = await getSkills();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">AgentsGate</h1>
            <p className="text-xs text-gray-400">上傳一次，適配所有 CLI</p>
          </div>
          <Link
            href="/upload"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            + 上傳 Skill / Agent
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Hero */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">AI Skill 與 Agent 分享平台</h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            開發者上傳 Skill 或 Agent 後，平台自動產生 Claude Code、GitHub Copilot、Gemini CLI 與 Kiro 的適配檔案。
          </p>
        </div>

        {/* Skills / Agents */}
        {skills.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg mb-2">目前尚無已發布的技能</p>
            <p className="text-sm">
              <Link href="/upload" className="text-blue-500 hover:underline">上傳第一個 Skill 或 Agent</Link>
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800">
                所有技能與代理人
                <span className="ml-2 text-sm font-normal text-gray-400">（{skills.length} 個）</span>
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {skills.map((skill) => (
                <SkillCard key={skill.id} skill={skill} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function SkillCard({ skill }: { skill: SkillResponse }) {
  const isAgent = skill.type === 'AGENT';
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="font-mono text-sm font-semibold text-gray-900 break-all">{skill.name}</span>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
              isAgent ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
            }`}>
              {TYPE_LABEL[skill.type] ?? skill.type}
            </span>
            <span className="text-xs text-gray-400">v{skill.version}</span>
          </div>
        </div>
        <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${
          skill.status === 'PUBLISHED' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}>
          {STATUS_LABEL[skill.status] ?? skill.status}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">{skill.description}</p>

      {/* Tags */}
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

      {/* CLI compat */}
      <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
        <span className="text-xs text-gray-400">CLI：</span>
        {['Claude Code', 'Copilot', 'Gemini', 'Kiro'].map((cli, i) => {
          const blocked = skill.hasMcpSpec && (cli === 'Gemini' || cli === 'Kiro');
          return (
            <span key={cli} className={`text-xs ${blocked ? 'text-red-400 line-through' : 'text-green-600'}`}>
              {blocked ? '✗' : '✓'} {cli}
            </span>
          );
        })}
      </div>
    </div>
  );
}

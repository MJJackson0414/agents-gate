import Link from 'next/link';
import { fetchSkills, SkillResponse } from '@/lib/api';
import SkillExplorer from '@/components/SkillExplorer';

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
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">AI Skill 與 Agent 分享平台</h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            開發者上傳 Skill 或 Agent 後，平台自動產生 Claude Code、GitHub Copilot、Gemini CLI 與 Kiro 的適配檔案。
          </p>
        </div>

        <SkillExplorer initialSkills={skills} />
      </main>
    </div>
  );
}

import { fetchSkills, SkillResponse } from '@/lib/api';
import SkillExplorer from '@/components/SkillExplorer';
import HomeHeader from '@/components/HomeHeader';

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
      <HomeHeader />

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

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Globe, Server, HardDrive, Package, File } from 'lucide-react';
import { fetchSkillById, SkillDetailResponse } from '@/lib/api';
import HomeHeader from '@/components/HomeHeader';
import InstallCommand from '@/components/skill-detail/InstallCommand';
import CliCompatibility from '@/components/skill-detail/CliCompatibility';

// ── Constants ──────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  PUBLISHED: '已發布',
  DRAFT: '草稿',
  PENDING_AI_REVIEW: 'AI 審核中',
  PENDING_HUMAN_REVIEW: '人工審核中',
  AI_REJECTED_REVIEW: 'AI 拒絕複審中',
  REJECTED: '已退回',
};

const STATUS_COLOR: Record<string, string> = {
  PUBLISHED: 'bg-green-100 text-green-800',
  DRAFT: 'bg-gray-100 text-gray-600',
  PENDING_AI_REVIEW: 'bg-yellow-100 text-yellow-800',
  PENDING_HUMAN_REVIEW: 'bg-blue-100 text-blue-800',
  AI_REJECTED_REVIEW: 'bg-orange-100 text-orange-800',
  REJECTED: 'bg-red-100 text-red-700',
};

const OS_LABEL: Record<string, string> = {
  WINDOWS: 'Windows',
  MACOS: 'macOS',
};

const ENV_ROWS = [
  { key: 'requiresInternet' as const,       label: '需要網路連線',    Icon: Globe },
  { key: 'requiresMcpServer' as const,      label: '需要 MCP Server', Icon: Server },
  { key: 'requiresLocalService' as const,   label: '需要本地服務',    Icon: HardDrive },
  { key: 'requiresSystemPackages' as const, label: '需要系統套件',    Icon: Package },
];

// ── Section helper ──────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h2 className="text-base font-semibold text-gray-800 mb-4">{title}</h2>
      {children}
    </div>
  );
}

// ── Metadata ────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await fetchSkillById(id);
  if (!res.success || !res.data) {
    return { title: 'Skill 不存在 | AgentsGate' };
  }
  return { title: `${res.data.name} | AgentsGate` };
}

// ── Page ────────────────────────────────────────────────────

export default async function SkillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await fetchSkillById(id);

  if (!res.success || !res.data) {
    notFound();
  }

  const skill: SkillDetailResponse = res.data;
  const env = skill.environmentDeclaration;

  return (
    <div className="min-h-screen bg-gray-50">
      <HomeHeader />

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← 返回首頁
        </Link>

        {/* Header Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 className="font-mono text-2xl font-bold text-gray-900">{skill.name}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                skill.type === 'SKILL'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-purple-100 text-purple-700'
              }`}>
                {skill.type}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                v{skill.version}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                STATUS_COLOR[skill.status] ?? 'bg-gray-100 text-gray-600'
              }`}>
                {STATUS_LABEL[skill.status] ?? skill.status}
              </span>
            </div>
          </div>

          <div className="text-xs text-gray-400 space-y-0.5">
            <p>作者：{skill.authorName} &lt;{skill.authorEmail}&gt;</p>
            <p>
              建立於{' '}
              {new Date(skill.createdAt).toLocaleDateString('zh-TW', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          <p className="text-gray-700 text-sm leading-relaxed">{skill.description}</p>
        </div>

        {/* Install Command */}
        <Section title="安裝指令">
          <InstallCommand skillName={skill.name} />
          
          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-2">
            <h3 className="text-sm font-medium text-gray-800">開發者選項</h3>
            <p className="text-xs text-gray-500">
              您可以下載已經打包好的 npm CLI 專案範本。下載後解壓縮，即可在本地測試或使用 <code className="bg-gray-100 px-1 rounded">npm publish</code> 直接發布到 npm 平台提供他人下載安裝您的 Skill。
            </p>
            <a 
              href={`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'}/api/v1/skills/${skill.id}/cli-package`}
              download
              className="inline-flex w-fit items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-medium rounded-lg text-sm transition-colors"
            >
              <Package size={16} />
              下載 CLI 封裝套件 (ZIP)
            </a>
          </div>
        </Section>

        {/* CLI Compatibility */}
        <Section title="CLI 相容性">
          <CliCompatibility hasMcpSpec={skill.hasMcpSpec} sourceCliFormat={skill.sourceCliFormat} />
        </Section>

        {/* Tags + OS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Section title="標籤">
            <div className="flex flex-wrap gap-2">
              {skill.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </Section>

          <Section title="OS 相容性">
            <div className="flex flex-wrap gap-2">
              {skill.osCompatibility.map((os) => (
                <span
                  key={os}
                  className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-xs font-medium"
                >
                  {OS_LABEL[os] ?? os}
                </span>
              ))}
            </div>
          </Section>
        </div>

        {/* Environment Requirements */}
        {env && (
          <Section title="環境需求">
            <div className="space-y-2">
              {ENV_ROWS.map(({ key, label, Icon }) => (
                <div key={key} className="flex items-center gap-3">
                  {env[key] ? (
                    <span className="text-green-500 font-bold text-sm">✓</span>
                  ) : (
                    <span className="text-gray-300 font-bold text-sm">—</span>
                  )}
                  <Icon size={14} className={env[key] ? 'text-green-500' : 'text-gray-300'} />
                  <span className={`text-sm ${env[key] ? 'text-gray-700' : 'text-gray-400'}`}>
                    {label}
                  </span>
                </div>
              ))}
              {env.additionalNotes && (
                <p className="mt-3 text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
                  {env.additionalNotes}
                </p>
              )}
            </div>
          </Section>
        )}

        {/* Variables */}
        {skill.variables && skill.variables.length > 0 && (
          <Section title="使用者變數">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                  <th className="pb-2 pr-4">變數名稱</th>
                  <th className="pb-2 pr-4">說明</th>
                  <th className="pb-2">範例值</th>
                </tr>
              </thead>
              <tbody>
                {skill.variables.map((v) => (
                  <tr key={v.name} className="border-b border-gray-50">
                    <td className="py-2 pr-4 font-mono text-blue-700">{`{${v.name}}`}</td>
                    <td className="py-2 pr-4 text-gray-600">{v.description || '—'}</td>
                    <td className="py-2 text-gray-500">{v.example || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        )}

        {/* MCP Spec */}
        {skill.mcpSpec && (
          <Section title="MCP Server 設定">
            <div className="bg-gray-50 rounded-lg p-4 font-mono text-xs space-y-1 text-gray-700">
              <div><span className="text-gray-400">serverName: </span>{skill.mcpSpec.serverName}</div>
              <div><span className="text-gray-400">command: </span>{skill.mcpSpec.command}</div>
              {skill.mcpSpec.args && skill.mcpSpec.args.length > 0 && (
                <div><span className="text-gray-400">args: </span>[{skill.mcpSpec.args.join(', ')}]</div>
              )}
              {skill.mcpSpec.env && Object.keys(skill.mcpSpec.env).length > 0 && (
                <div>
                  <span className="text-gray-400">env:</span>
                  {Object.entries(skill.mcpSpec.env).map(([k, v]) => (
                    <div key={k} className="ml-4">{k}: {v}</div>
                  ))}
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Content */}
        <Section title="核心指令內容">
          <pre className="text-sm font-mono bg-gray-50 border border-gray-100 rounded-lg p-4 overflow-auto max-h-96 whitespace-pre-wrap text-gray-700 leading-relaxed">
            {skill.content}
          </pre>
        </Section>

        {/* Installation Steps */}
        {skill.installationSteps && skill.installationSteps.length > 0 && (
          <Section title="安裝步驟">
            <ol className="space-y-2 list-decimal list-inside">
              {skill.installationSteps.map((step, i) => (
                <li key={i} className="text-sm text-gray-700">{step}</li>
              ))}
            </ol>
          </Section>
        )}

        {/* Attached Files — filenames only */}
        {skill.attachedFiles && skill.attachedFiles.length > 0 && (
          <Section title="附加檔案">
            <ul className="space-y-1.5">
              {skill.attachedFiles.map((f) => (
                <li key={f.filename} className="flex items-center gap-2 text-sm text-gray-700">
                  <File size={14} className="text-gray-400 shrink-0" />
                  <span className="font-mono">{f.filename}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-amber-700 bg-amber-50 rounded-lg p-2.5">
              ⚠ 基於安全考量，附加檔案內容不對外公開，安裝後可在本地查看。
            </p>
          </Section>
        )}

        {/* Changelog */}
        <Section title="更新紀錄">
          <pre className="text-sm font-mono bg-gray-50 border border-gray-100 rounded-lg p-4 whitespace-pre-wrap text-gray-700 leading-relaxed">
            {skill.changelog}
          </pre>
        </Section>

      </main>
    </div>
  );
}

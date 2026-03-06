'use client';

import { useRouter, useParams } from 'next/navigation';
import { useUpload, OsType, EnvironmentDeclaration, McpSpec } from '@/lib/upload-context';
import { Plus, Trash2 } from 'lucide-react';

const TYPE_LABEL: Record<string, string> = {
  skill: 'Skill（技能）',
  agent: 'Agent（代理人）',
};

function buildCompatibilityText(env: EnvironmentDeclaration, hasMcp: boolean): string {
  const parts: string[] = [];
  if (env.requiresInternet) parts.push('網路連線');
  if (env.requiresMcpServer || hasMcp) parts.push('MCP Server 支援');
  if (env.requiresLocalService) parts.push('本地服務（資料庫或常駐程式）');
  if (env.requiresSystemPackages) parts.push('特定系統套件');
  if (parts.length === 0) return '無特殊環境需求，可在任何環境中執行。';
  return `需要 ${parts.join('、')}。`;
}

export default function WizardStep3Environment() {
  const router = useRouter();
  const params = useParams();
  const { state, updateForm, setStep } = useUpload();
  const { formData } = state;

  const typeLabel = TYPE_LABEL[String(params.type)] ?? String(params.type);

  const env = formData.environmentDeclaration ?? {
    requiresInternet: false,
    requiresMcpServer: false,
    requiresLocalService: false,
    requiresSystemPackages: false,
    additionalNotes: '',
  };
  const hasMcp = !!(formData.mcpSpec?.serverName);
  const osCompat = formData.osCompatibility ?? ['WINDOWS', 'MACOS'];

  function updateEnv(patch: Partial<EnvironmentDeclaration>) {
    updateForm({ environmentDeclaration: { ...env, ...patch } });
  }

  function toggleOs(os: OsType) {
    if (osCompat.includes(os)) {
      updateForm({ osCompatibility: osCompat.filter((o) => o !== os) });
    } else {
      updateForm({ osCompatibility: [...osCompat, os] });
    }
  }

  function updateMcp(patch: Partial<McpSpec>) {
    const current = formData.mcpSpec ?? { serverName: '', command: '', args: [], env: {} };
    updateForm({ mcpSpec: { ...current, ...patch } });
  }

  function clearMcp() {
    updateForm({ mcpSpec: null });
    updateEnv({ requiresMcpServer: false });
  }

  function addMcpArg() {
    const args = formData.mcpSpec?.args ?? [];
    updateMcp({ args: [...args, ''] });
  }

  function updateMcpArg(idx: number, value: string) {
    const args = [...(formData.mcpSpec?.args ?? [])];
    args[idx] = value;
    updateMcp({ args });
  }

  function removeMcpArg(idx: number) {
    updateMcp({ args: (formData.mcpSpec?.args ?? []).filter((_, i) => i !== idx) });
  }

  const compatText = buildCompatibilityText(env, hasMcp);
  const geminiBlocked = env.requiresMcpServer || hasMcp;

  function handleBack() {
    setStep(2);
    if (formData.archiveMode) {
      router.push('/upload/archive?step=2');
    } else {
      router.push(`/upload/${params.type}?step=2`);
    }
  }

  function handleNext() {
    setStep(4);
    if (formData.archiveMode) {
      router.push('/upload/archive?step=4');
    } else {
      router.push(`/upload/${params.type}?step=4`);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-1">環境設定</h2>
        <p className="text-sm text-gray-500">
          告訴下載者執行此 {typeLabel} 所需的環境條件。
        </p>
      </div>

      {/* 環境需求勾選 */}
      <div className="space-y-3 border border-gray-100 rounded-xl p-4 bg-gray-50">
        <CheckItem
          checked={env.requiresInternet}
          onChange={(v) => updateEnv({ requiresInternet: v })}
          label="需要網路連線"
          description="呼叫外部 API 或服務"
        />

        <CheckItem
          checked={env.requiresMcpServer}
          onChange={(v) => {
            updateEnv({ requiresMcpServer: v });
            if (!v) clearMcp();
          }}
          label="需要 MCP Server"
          description="使用 Claude MCP 協定進行工具整合"
        />

        {env.requiresMcpServer && (
          <div className="ml-6 mt-2 p-4 bg-white border border-gray-200 rounded-lg space-y-3">
            <p className="text-xs font-medium text-gray-600">MCP Server 規格</p>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Server 名稱 *</label>
              <input
                type="text"
                value={formData.mcpSpec?.serverName ?? ''}
                onChange={(e) => updateMcp({ serverName: e.target.value })}
                placeholder="my-mcp-server"
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">指令 *</label>
              <input
                type="text"
                value={formData.mcpSpec?.command ?? ''}
                onChange={(e) => updateMcp({ command: e.target.value })}
                placeholder="npx"
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-gray-500">參數（Args）</label>
                <button type="button" onClick={addMcpArg} className="text-xs text-blue-600 flex items-center gap-1">
                  <Plus size={10} /> 新增參數
                </button>
              </div>
              <div className="space-y-1">
                {(formData.mcpSpec?.args ?? []).map((arg, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={arg}
                      onChange={(e) => updateMcpArg(idx, e.target.value)}
                      placeholder="@org/mcp-package"
                      className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                    <button type="button" onClick={() => removeMcpArg(idx)} className="text-gray-400 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <CheckItem
          checked={env.requiresLocalService}
          onChange={(v) => updateEnv({ requiresLocalService: v })}
          label="需要本地服務"
          description="資料庫、Docker 容器或背景常駐程式"
        />

        <CheckItem
          checked={env.requiresSystemPackages}
          onChange={(v) => updateEnv({ requiresSystemPackages: v })}
          label="需要系統套件"
          description="git、node、python3、docker 或類似 CLI 工具"
        />
      </div>

      {/* 無特殊需求標示 */}
      {!env.requiresInternet && !env.requiresMcpServer && !env.requiresLocalService && !env.requiresSystemPackages && (
        <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
          ✅ 無特殊需求 — 可在任何環境中執行
        </div>
      )}

      {/* OS 相容性 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          作業系統相容性 <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-3">
          {(['WINDOWS', 'MACOS'] as OsType[]).map((os) => (
            <label key={os} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={osCompat.includes(os)}
                onChange={() => toggleOs(os)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm text-gray-700">{os === 'WINDOWS' ? 'Windows' : 'macOS'}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 補充說明 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          補充說明
          <span className="text-gray-400 font-normal text-xs ml-1">（選填）</span>
        </label>
        <textarea
          value={env.additionalNotes ?? ''}
          onChange={(e) => updateEnv({ additionalNotes: e.target.value })}
          placeholder="例如：需要開放 3000 埠、PostgreSQL 15+，或特定環境變數..."
          rows={3}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>

      {/* 自動產生的相容性描述 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          自動產生的相容性描述
        </label>
        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 font-mono">
          {compatText}
        </div>
        {geminiBlocked && (
          <p className="text-xs text-red-600 mt-1">
            ⚠️ 偵測到 MCP Server → <strong>Gemini CLI：❌ 不支援</strong>
          </p>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <button
          onClick={handleBack}
          className="px-6 py-2 border border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          ← 上一步
        </button>
        <button
          onClick={handleNext}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          下一步：預覽 →
        </button>
      </div>
    </div>
  );
}

function CheckItem({
  checked, onChange, label, description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 w-4 h-4 text-blue-600"
      />
      <div>
        <span className="text-sm font-medium text-gray-800 group-hover:text-blue-700">{label}</span>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
    </label>
  );
}

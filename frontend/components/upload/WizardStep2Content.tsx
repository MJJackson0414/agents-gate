'use client';

import { useRouter, useParams } from 'next/navigation';
import { useUpload } from '@/lib/upload-context';
import { Plus, Trash2 } from 'lucide-react';

const TYPE_LABEL: Record<string, string> = {
  skill: 'Skill（技能）',
  agent: 'Agent（代理人）',
};

export default function WizardStep2Content() {
  const router = useRouter();
  const params = useParams();
  const { state, updateForm, setErrors, clearError, setStep } = useUpload();
  const { formData, errors } = state;

  const typeLabel = TYPE_LABEL[String(params.type)] ?? String(params.type);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!formData.content?.trim()) errs.content = '核心指令內容為必填';
    const steps = (formData.installationSteps ?? []).filter((s) => s.trim());
    if (steps.length === 0) errs.installationSteps = '至少需要一個安裝步驟';
    if (!formData.changelog?.trim()) errs.changelog = '更新紀錄為必填';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleBack() {
    setStep(1);
    router.push(`/upload/${params.type}?step=1`);
  }

  function handleNext() {
    if (!validate()) return;
    setStep(3);
    router.push(`/upload/${params.type}?step=3`);
  }

  function addStep() {
    updateForm({ installationSteps: [...(formData.installationSteps ?? []), ''] });
  }

  function updateStep(idx: number, value: string) {
    const updated = [...(formData.installationSteps ?? [])];
    updated[idx] = value;
    updateForm({ installationSteps: updated });
    clearError('installationSteps');
  }

  function removeStep(idx: number) {
    const updated = (formData.installationSteps ?? []).filter((_, i) => i !== idx);
    updateForm({ installationSteps: updated.length > 0 ? updated : [''] });
  }

  function addDependency() {
    updateForm({ dependencies: [...(formData.dependencies ?? []), ''] });
  }

  function updateDependency(idx: number, value: string) {
    const updated = [...(formData.dependencies ?? [])];
    updated[idx] = value;
    updateForm({ dependencies: updated });
  }

  function removeDependency(idx: number) {
    updateForm({ dependencies: (formData.dependencies ?? []).filter((_, i) => i !== idx) });
  }

  // 基本 SKILL.md frontmatter 解析
  function parseFrontmatter(text: string) {
    const match = text.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return;
    const fm = match[1];
    const nameMatch = fm.match(/^name:\s*(.+)/m);
    const descMatch = fm.match(/^description:\s*(.+)/m);
    const body = text.replace(/^---\n[\s\S]*?\n---\n?/, '').trim();
    if (nameMatch || descMatch || body) {
      updateForm({
        ...(nameMatch ? { name: nameMatch[1].trim() } : {}),
        ...(descMatch ? { description: descMatch[1].trim() } : {}),
        ...(body ? { content: body } : {}),
      });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-1">內容</h2>
        <p className="text-sm text-gray-500">您的 {typeLabel} 的核心指令內容。</p>
      </div>

      {/* 貼上 SKILL.md 提示 */}
      <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700">
        <strong>提示：</strong>貼上現有的 SKILL.md 後，系統將自動填入欄位。{' '}
        <label className="underline cursor-pointer">
          貼上並自動填入
          <textarea
            className="hidden"
            onPaste={(e) => {
              const text = e.clipboardData.getData('text');
              parseFrontmatter(text);
            }}
          />
        </label>
      </div>

      {/* 核心指令內容 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          核心指令內容 <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-gray-400 mb-2">
          通用版本的指令主體 — 平台將自動轉換為各 CLI 格式。
        </p>
        <textarea
          value={formData.content ?? ''}
          onChange={(e) => {
            updateForm({ content: e.target.value });
            clearError('content');
          }}
          placeholder={`撰寫您的 ${state.type === 'skill' ? '指令說明' : '代理人角色與行為定義'}...`}
          rows={10}
          className={`w-full px-3 py-2 text-sm font-mono border rounded-lg focus:outline-none focus:ring-2 transition-colors resize-y ${
            errors.content ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-300'
          }`}
        />
        {errors.content && <p className="text-xs text-red-600 mt-1">{errors.content}</p>}
      </div>

      {/* 安裝步驟 */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-gray-700">
            安裝步驟 <span className="text-red-500">*</span>
          </label>
          <button
            type="button"
            onClick={addStep}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
          >
            <Plus size={12} /> 新增步驟
          </button>
        </div>
        <p className="text-xs text-gray-400 mb-2">
          說明安裝位置與環境配置需求（如：複製到 <code className="bg-gray-100 px-1 rounded">~/.claude/skills/</code> 資料夾）
        </p>
        {errors.installationSteps && (
          <p className="text-xs text-red-600 mb-1">{errors.installationSteps}</p>
        )}
        <div className="space-y-2">
          {(formData.installationSteps ?? ['']).map((step, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <span className="text-xs text-gray-400 w-5 text-right shrink-0">{idx + 1}.</span>
              <input
                type="text"
                value={step}
                onChange={(e) => updateStep(idx, e.target.value)}
                placeholder={
                  idx === 0
                    ? '例如：將檔案複製到 ~/.claude/skills/your-skill/ 資料夾'
                    : idx === 1
                    ? '例如：需要 Node.js >= 18 環境'
                    : `步驟 ${idx + 1}`
                }
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              {(formData.installationSteps ?? []).length > 1 && (
                <button
                  type="button"
                  onClick={() => removeStep(idx)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 相依套件 */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-gray-700">
            相依套件
            <span className="text-gray-400 font-normal text-xs ml-1">（選填 — 列出所需套件或執行環境）</span>
          </label>
          <button
            type="button"
            onClick={addDependency}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
          >
            <Plus size={12} /> 新增
          </button>
        </div>
        <div className="space-y-2">
          {(formData.dependencies ?? []).map((dep, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                type="text"
                value={dep}
                onChange={(e) => updateDependency(idx, e.target.value)}
                placeholder="例如：node >= 18、git、python3"
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <button
                type="button"
                onClick={() => removeDependency(idx)}
                className="text-gray-400 hover:text-red-500"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {(formData.dependencies ?? []).length === 0 && (
            <p className="text-sm text-gray-400 italic">尚未新增相依套件 — 若無需求可留空。</p>
          )}
        </div>
      </div>

      {/* 更新紀錄 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          更新紀錄 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.changelog ?? '初始版本。'}
          onChange={(e) => { updateForm({ changelog: e.target.value }); clearError('changelog'); }}
          placeholder="初始版本。"
          className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
            errors.changelog ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-300'
          }`}
        />
        {errors.changelog && <p className="text-xs text-red-600 mt-1">{errors.changelog}</p>}
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
          下一步：環境設定 →
        </button>
      </div>
    </div>
  );
}

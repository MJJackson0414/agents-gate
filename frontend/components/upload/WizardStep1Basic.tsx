'use client';

import { useRouter, useParams } from 'next/navigation';
import { useUpload } from '@/lib/upload-context';
import { useState } from 'react';
import { fetchSkillByNameAndType } from '@/lib/api';

const PRESET_TAGS = ['coding', 'ai', 'git', 'security', 'testing', 'docs', 'refactor', 'devops'];

const TYPE_LABEL: Record<string, string> = {
  skill: 'Skill（技能）',
  agent: 'Agent（代理人）',
};

export default function WizardStep1Basic() {
  const router = useRouter();
  const params = useParams();
  const { state, updateForm, setErrors, clearError, setStep } = useUpload();
  const { formData, errors } = state;
  const [tagInput, setTagInput] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [existingFound, setExistingFound] = useState(false);

  async function handleNameBlur() {
    const name = (formData.name ?? '').trim();
    if (!name || !/^[a-z0-9-]+$/.test(name) || !state.type) return;

    const type = state.type.toUpperCase() as 'SKILL' | 'AGENT';
    setLookupLoading(true);
    setExistingFound(false);
    try {
      const found = await fetchSkillByNameAndType(name, type);
      if (found) {
        setExistingFound(true);
        updateForm({
          description: found.description,
          version: found.version,
          tags: found.tags,
          authorName: found.authorName,
          authorEmail: found.authorEmail,
          changelog: found.changelog,
          content: found.content,
          installationSteps: found.installationSteps,
          dependencies: found.dependencies,
          osCompatibility: found.osCompatibility as ('WINDOWS' | 'MACOS')[],
          environmentDeclaration: found.environmentDeclaration ?? undefined,
          mcpSpec: found.mcpSpec ?? null,
          cliOverrides: found.cliOverrides ?? {},
          variables: found.variables ?? [],
          attachedFiles: found.attachedFiles ?? [],
        });
      }
    } finally {
      setLookupLoading(false);
    }
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!formData.name?.trim()) errs.name = '名稱為必填';
    else if (!/^[a-z0-9-]+$/.test(formData.name)) errs.name = '只能使用小寫英文、數字與連字號';
    else if (formData.name.length > 64) errs.name = '最多 64 個字元';

    if (!formData.description?.trim()) errs.description = '描述為必填';
    else if (formData.description.length > 1024) errs.description = '最多 1024 個字元';

    if (!formData.version?.trim()) errs.version = '版本號為必填';
    else if (!/^\d+\.\d+\.\d+$/.test(formData.version)) errs.version = '請使用 SemVer 格式（如 1.0.0）';

    if ((formData.tags ?? []).length === 0) errs.tags = '至少需要一個標籤';
    if (!formData.authorName?.trim()) errs.authorName = '作者姓名為必填';
    if (!formData.authorEmail?.trim()) errs.authorEmail = '作者信箱為必填';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.authorEmail)) errs.authorEmail = '信箱格式不正確';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNext() {
    if (!validate()) return;
    setStep(2);
    router.push(`/upload/${params.type}?step=2`);
  }

  function addTag(tag: string) {
    const trimmed = tag.trim().toLowerCase();
    if (!trimmed) return;
    const current = formData.tags ?? [];
    if (current.length >= 5 || current.includes(trimmed)) return;
    updateForm({ tags: [...current, trimmed] });
    setTagInput('');
  }

  function removeTag(tag: string) {
    updateForm({ tags: (formData.tags ?? []).filter((t) => t !== tag) });
  }

  const descLen = formData.description?.length ?? 0;
  const typeLabel = TYPE_LABEL[String(params.type)] ?? String(params.type);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-1">基本資訊</h2>
        <p className="text-sm text-gray-500">定義您的 {typeLabel} 的基本識別資訊。</p>
      </div>

      {/* 名稱 */}
      <Field label="名稱" required error={errors.name} hint="只能使用小寫英文、數字與連字號（最多 64 字元）">
        <input
          type="text"
          value={formData.name ?? ''}
          onChange={(e) => {
            updateForm({ name: e.target.value });
            clearError('name');
            setExistingFound(false);
          }}
          onBlur={handleNameBlur}
          placeholder="my-skill-name"
          className={inputClass(!!errors.name)}
        />
        {lookupLoading && (
          <p className="text-xs text-gray-400 mt-1">查詢中...</p>
        )}
        {!lookupLoading && existingFound && (
          <div className="mt-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
            已找到相同名稱的 {state.type?.toUpperCase()}，已自動帶入現有資料，請修改需要更新的欄位後重新送出。
          </div>
        )}
        {!lookupLoading && !existingFound && formData.name && !errors.name && /^[a-z0-9-]+$/.test(formData.name) && (
          <p className="text-xs text-green-600 mt-1">✓ 格式正確</p>
        )}
      </Field>

      {/* 描述 */}
      <Field
        label="描述"
        required
        error={errors.description}
        hint="說明何時及為何使用此技能 — 顯示於搜尋結果及 CLI 載入決策中"
      >
        <textarea
          value={formData.description ?? ''}
          onChange={(e) => {
            updateForm({ description: e.target.value });
            clearError('description');
          }}
          placeholder="此技能可以幫您... 適合在...時使用"
          rows={3}
          className={inputClass(!!errors.description)}
        />
        <p className={`text-xs mt-1 text-right ${descLen > 1024 ? 'text-red-500' : 'text-gray-400'}`}>
          {descLen}/1024
        </p>
        <p className="text-xs text-gray-400 italic">
          範例：「自動產生符合規範的 commit message。在您準備好提交變更時使用。」
        </p>
      </Field>

      {/* 版本號 */}
      <Field label="版本號" required error={errors.version}>
        <input
          type="text"
          value={formData.version ?? '1.0.0'}
          onChange={(e) => {
            updateForm({ version: e.target.value });
            clearError('version');
          }}
          placeholder="1.0.0"
          className={inputClass(!!errors.version)}
        />
      </Field>

      {/* 標籤 */}
      <Field label="標籤" required error={errors.tags} hint="最多 5 個標籤 — 描述使用情境">
        <div className="flex flex-wrap gap-1 mb-2">
          {(formData.tags ?? []).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-sm rounded"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="text-blue-400 hover:text-blue-700"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput); } }}
            placeholder="輸入後按 Enter 新增"
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
            disabled={(formData.tags ?? []).length >= 5}
          />
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {PRESET_TAGS.filter((t) => !(formData.tags ?? []).includes(t)).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => addTag(t)}
              className="px-2 py-0.5 text-xs border border-gray-200 rounded hover:border-blue-300 hover:text-blue-600 text-gray-500"
              disabled={(formData.tags ?? []).length >= 5}
            >
              + {t}
            </button>
          ))}
        </div>
      </Field>

      {/* 作者資訊 */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="作者姓名" required error={errors.authorName}>
          <input
            type="text"
            value={formData.authorName ?? ''}
            onChange={(e) => { updateForm({ authorName: e.target.value }); clearError('authorName'); }}
            placeholder="您的姓名"
            className={inputClass(!!errors.authorName)}
          />
        </Field>
        <Field label="作者信箱" required error={errors.authorEmail}>
          <input
            type="email"
            value={formData.authorEmail ?? ''}
            onChange={(e) => { updateForm({ authorEmail: e.target.value }); clearError('authorEmail'); }}
            placeholder="you@example.com"
            className={inputClass(!!errors.authorEmail)}
          />
        </Field>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={handleNext}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          下一步：內容 →
        </button>
      </div>
    </div>
  );
}

function inputClass(hasError: boolean) {
  return `w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
    hasError
      ? 'border-red-300 focus:ring-red-200'
      : 'border-gray-200 focus:ring-blue-300'
  }`;
}

function Field({
  label, required, error, hint, children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

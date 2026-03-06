import { clsx } from 'clsx';

const CLI_DEFS = [
  { key: 'claude',  label: 'Claude Code',    format: 'CLAUDE' },
  { key: 'copilot', label: 'GitHub Copilot', format: 'COPILOT' },
  { key: 'gemini',  label: 'Gemini CLI',     format: 'GEMINI' },
  { key: 'kiro',    label: 'Kiro',           format: 'KIRO' },
] as const;

interface CliCompatibilityProps {
  hasMcpSpec: boolean;
  sourceCliFormat?: string | null;
}

export default function CliCompatibility({ hasMcpSpec, sourceCliFormat }: CliCompatibilityProps) {
  const isCliSpecific = !!sourceCliFormat;

  return (
    <div className="flex flex-wrap gap-2">
      {CLI_DEFS.map(({ key, label, format }) => {
        const blocked = isCliSpecific
          ? format !== sourceCliFormat
          : hasMcpSpec && (key === 'gemini' || key === 'kiro');
        return (
          <span
            key={key}
            className={clsx(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border',
              blocked
                ? 'bg-red-50 text-red-600 border-red-200'
                : 'bg-green-50 text-green-700 border-green-200'
            )}
          >
            {blocked ? '✗' : '✓'} {label}
          </span>
        );
      })}
      {isCliSpecific && (
        <p className="w-full text-xs text-orange-700 mt-1">
          ⚠ 此 Skill 為 {CLI_DEFS.find((c) => c.format === sourceCliFormat)?.label ?? sourceCliFormat} 專屬格式，不適用其他 CLI。
        </p>
      )}
      {!isCliSpecific && hasMcpSpec && (
        <p className="w-full text-xs text-orange-700 mt-1">
          ⚠ 此 Skill 包含 MCP Server 設定，Gemini CLI 與 Kiro 不支援。
        </p>
      )}
    </div>
  );
}

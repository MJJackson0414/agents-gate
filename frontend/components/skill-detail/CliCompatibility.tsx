import { clsx } from 'clsx';

const CLI_DEFS = [
  { key: 'claude',  label: 'Claude Code' },
  { key: 'copilot', label: 'GitHub Copilot' },
  { key: 'gemini',  label: 'Gemini CLI' },
  { key: 'kiro',    label: 'Kiro' },
] as const;

interface CliCompatibilityProps {
  hasMcpSpec: boolean;
}

export default function CliCompatibility({ hasMcpSpec }: CliCompatibilityProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {CLI_DEFS.map(({ key, label }) => {
        const blocked = hasMcpSpec && (key === 'gemini' || key === 'kiro');
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
      {hasMcpSpec && (
        <p className="w-full text-xs text-orange-700 mt-1">
          ⚠ 此 Skill 包含 MCP Server 設定，Gemini CLI 與 Kiro 不支援。
        </p>
      )}
    </div>
  );
}

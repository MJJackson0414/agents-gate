'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface InstallCommandProps {
  skillName: string;
}

export default function InstallCommand({ skillName }: InstallCommandProps) {
  const [copied, setCopied] = useState(false);
  const command = `npx agentsgate install ${skillName}`;

  function handleCopy() {
    navigator.clipboard.writeText(command).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="bg-gray-900 rounded-xl p-4 flex items-center justify-between gap-4">
      <code className="text-green-400 font-mono text-sm break-all">{command}</code>
      <button
        onClick={handleCopy}
        title="複製指令"
        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                   bg-white/10 hover:bg-white/20 text-white text-xs font-medium
                   transition-colors cursor-pointer"
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
        {copied ? '已複製！' : '複製'}
      </button>
    </div>
  );
}

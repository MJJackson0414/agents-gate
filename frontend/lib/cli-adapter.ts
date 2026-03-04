import { UploadFormData, SkillType } from './upload-context';

export type CliTarget = 'claude' | 'copilot' | 'gemini' | 'kiro';

export interface CliAdapterResult {
  target: CliTarget;
  filename: string;
  content: string;
  supported: boolean;
  unsupportedReason?: string;
}

export function generateAdapters(
  formData: Partial<UploadFormData>,
  type: SkillType
): CliAdapterResult[] {
  const hasMcp = !!(formData.mcpSpec?.serverName);
  const name = formData.name ?? 'my-skill';
  const description = formData.cliOverrides?.['claude'] ?? formData.description ?? '';
  const content = formData.content ?? '';

  return [
    generateClaude(name, description, content, type),
    generateCopilot(name, description, content, type, formData),
    generateGemini(name, description, content, type, hasMcp),
    generateKiro(name, description, content, type),
  ];
}

function generateClaude(
  name: string,
  description: string,
  content: string,
  type: SkillType
): CliAdapterResult {
  const filename = type === 'skill' ? `SKILL.md` : `${name}.agent.md`;
  const frontmatter = type === 'skill'
    ? `---\nname: ${name}\ndescription: ${description}\nuser-invocable: true\n---`
    : `---\nname: ${name}\ndescription: ${description}\n---`;

  return {
    target: 'claude',
    filename,
    content: `${frontmatter}\n\n${content}`,
    supported: true,
  };
}

function generateCopilot(
  name: string,
  description: string,
  content: string,
  type: SkillType,
  formData: Partial<UploadFormData>
): CliAdapterResult {
  const copilotDesc = formData.cliOverrides?.['copilot'] ?? description;
  const filename = type === 'agent' ? `${name}.agent.md` : `SKILL.md`;

  if (type === 'agent') {
    const frontmatter = `---\nname: ${name}\ndescription: ${copilotDesc}\ntools: []\n---`;
    return {
      target: 'copilot',
      filename,
      content: `${frontmatter}\n\n${content}`,
      supported: true,
    };
  }

  // Skill follows AgentSkills open standard
  const frontmatter = `---\nname: ${name}\ndescription: ${copilotDesc}\n---`;
  return {
    target: 'copilot',
    filename,
    content: `${frontmatter}\n\n${content}`,
    supported: true,
  };
}

function generateGemini(
  name: string,
  description: string,
  content: string,
  type: SkillType,
  hasMcp: boolean
): CliAdapterResult {
  if (hasMcp) {
    return {
      target: 'gemini',
      filename: `${name}.toml`,
      content: '',
      supported: false,
      unsupportedReason: 'Gemini CLI does not support MCP Server configuration',
    };
  }

  // Gemini uses TOML format
  const geminiContent =
    `name = "${name}"\ndescription = "${description}"\n\n[content]\nbody = """\n${content}\n"""`;

  return {
    target: 'gemini',
    filename: `${name}.toml`,
    content: geminiContent,
    supported: true,
  };
}

function generateKiro(
  name: string,
  description: string,
  content: string,
  _type: SkillType
): CliAdapterResult {
  const kiroContent = `---\ninclusion: manual\n---\n\n# ${name}\n\n${description}\n\n${content}`;
  return {
    target: 'kiro',
    filename: `${name}.md`,
    content: kiroContent,
    supported: true,
  };
}

export function getCliLabel(target: CliTarget): string {
  const labels: Record<CliTarget, string> = {
    claude: 'Claude Code',
    copilot: 'GitHub Copilot',
    gemini: 'Gemini CLI',
    kiro: 'Kiro',
  };
  return labels[target];
}

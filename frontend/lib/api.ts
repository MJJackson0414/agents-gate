const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    fieldErrors?: Record<string, string>;
  };
}

export interface SkillReviewResult {
  approved: boolean;
  summary: string;
  userExplanation?: string;
  issues: string[];
  suggestions: string[];
}

export interface SkillResponse {
  id: string;
  name: string;
  type: 'SKILL' | 'AGENT';
  description: string;
  status: 'DRAFT' | 'PENDING_AI_REVIEW' | 'PENDING_HUMAN_REVIEW' | 'AI_REJECTED_REVIEW' | 'PUBLISHED' | 'REJECTED';
  version: string;
  tags: string[];
  hasMcpSpec: boolean;
  reviewFeedback: string | null;
  createdAt: string;
}

/** Full detail response from GET /api/v1/skills/{id} — contains all fields for pre-filling the upload form. */
export interface SkillDetailResponse {
  id: string;
  name: string;
  type: 'SKILL' | 'AGENT';
  description: string;
  status: string;
  version: string;
  changelog: string;
  tags: string[];
  installationSteps: string[];
  dependencies: string[];
  osCompatibility: ('WINDOWS' | 'MACOS')[];
  authorName: string;
  authorEmail: string;
  hasMcpSpec: boolean;
  reviewFeedback: string | null;
  environmentDeclaration: {
    requiresInternet: boolean;
    requiresMcpServer: boolean;
    requiresLocalService: boolean;
    requiresSystemPackages: boolean;
    additionalNotes: string | null;
  } | null;
  mcpSpec: {
    serverName: string;
    command: string;
    args: string[] | null;
    env: Record<string, string> | null;
  } | null;
  cliOverrides: Record<string, string> | null;
  content: string;
  variables: { name: string; description: string; example: string }[] | null;
  attachedFiles: { filename: string; content: string }[] | null;
  createdAt: string;
}

export async function uploadSkill(payload: unknown): Promise<ApiResponse<SkillResponse>> {
  const res = await fetch(`${API_BASE}/api/v1/skills`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json() as Promise<ApiResponse<SkillResponse>>;
}

export async function fetchSkills(): Promise<ApiResponse<SkillResponse[]>> {
  const res = await fetch(`${API_BASE}/api/v1/skills`, {
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });
  return res.json() as Promise<ApiResponse<SkillResponse[]>>;
}

export async function fetchSkillById(id: string): Promise<ApiResponse<SkillDetailResponse>> {
  const res = await fetch(`${API_BASE}/api/v1/skills/${id}`, {
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });
  return res.json() as Promise<ApiResponse<SkillDetailResponse>>;
}

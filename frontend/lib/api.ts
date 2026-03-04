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

export interface SkillResponse {
  id: string;
  name: string;
  type: 'SKILL' | 'AGENT';
  description: string;
  status: 'DRAFT' | 'PENDING_AI_REVIEW' | 'PENDING_HUMAN_REVIEW' | 'PUBLISHED' | 'REJECTED';
  version: string;
  tags: string[];
  hasMcpSpec: boolean;
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
  });
  return res.json() as Promise<ApiResponse<SkillResponse[]>>;
}

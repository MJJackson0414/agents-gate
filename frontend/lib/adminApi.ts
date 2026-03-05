const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';
const TOKEN_KEY = 'agentsgate-admin-token';

// --- Token helpers ---

export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setAdminToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearAdminToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

// --- Types ---

export interface AdminReviewItem {
  id: string;
  name: string;
  type: 'SKILL' | 'AGENT';
  description: string;
  authorName: string;
  authorEmail: string;
  version: string;
  tags: string[];
  status: 'PENDING_HUMAN_REVIEW' | 'AI_REJECTED_REVIEW';
  aiReviewPassed: boolean;
  aiReviewSummary: string | null;
  aiReviewUserExplanation: string | null;
  aiReviewIssues: string[];
  aiReviewSuggestions: string[];
  createdAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

// --- Internal fetch wrapper ---

async function adminFetch<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = getAdminToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Token': token ?? '',
      ...(options.headers as Record<string, string>),
    },
    cache: 'no-store',
  });

  if (res.status === 401) {
    clearAdminToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
    return { success: false, data: null, error: '未授權' };
  }

  return res.json() as Promise<ApiResponse<T>>;
}

// --- API functions ---

export async function verifyAdminPassword(password: string): Promise<ApiResponse<{ token: string }>> {
  const res = await fetch(`${API_BASE}/api/v1/admin/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  return res.json() as Promise<ApiResponse<{ token: string }>>;
}

export async function fetchPendingReviews(): Promise<ApiResponse<AdminReviewItem[]>> {
  return adminFetch<AdminReviewItem[]>('/api/v1/admin/reviews');
}

export async function approveReview(id: string): Promise<ApiResponse<null>> {
  return adminFetch<null>(`/api/v1/admin/reviews/${id}/approve`, { method: 'POST' });
}

export async function rejectReview(id: string): Promise<ApiResponse<null>> {
  return adminFetch<null>(`/api/v1/admin/reviews/${id}/reject`, { method: 'POST' });
}

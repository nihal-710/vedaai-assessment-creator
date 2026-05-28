import type {
  ApiResponse,
  Assignment,
  GenerationJob,
  GeneratedPaper,
  CreateAssignmentPayload,
  GenerateResponse,
} from '@/src/types/api';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ── Generic fetch wrapper ─────────────────────────────────────────────────────
async function apiFetch<T>(
  path:    string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(BASE_URL + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  let json: unknown = null;

try {
  json = await res.json();
} catch {
  json = null;
}

if (!res.ok) {
  const errorBody = json as { error?: string; message?: string } | null;
  throw new Error(errorBody?.error || errorBody?.message || 'Request failed: ' + res.status);
}

return json as T;
}

// ── Assignment APIs ───────────────────────────────────────────────────────────

export async function createAssignment(
  data: CreateAssignmentPayload
): Promise<Assignment> {
  const res = await apiFetch<ApiResponse<Assignment>>('/api/assignments', {
    method: 'POST',
    body:   JSON.stringify(data),
  });
  return res.data;
}

export async function getAssignments(): Promise<Assignment[]> {
  const res = await apiFetch<ApiResponse<Assignment[]>>('/api/assignments');
  return res.data ?? [];
}

export async function getAssignmentById(id: string): Promise<Assignment> {
  const res = await apiFetch<ApiResponse<Assignment>>('/api/assignments/' + id);
  return res.data;
}

export async function startGeneration(
  assignmentId: string
): Promise<{ jobId: string; assignmentId: string; status: string; direct?: boolean; paper?: GeneratedPaper }> {
  const res = await apiFetch<ApiResponse<GenerateResponse | GeneratedPaper>>(
    '/api/assignments/' + assignmentId + '/generate',
    { method: 'POST' }
  );

  // Queue-based response
  if ('jobId' in res.data) {
    const d = res.data as GenerateResponse;
    return { jobId: d.jobId, assignmentId: d.assignmentId, status: d.status };
  }

  // Direct response (Redis unavailable)
  const paper = res.data as GeneratedPaper;
  return {
    jobId:        '',
    assignmentId,
    status:       'completed',
    direct:       true,
    paper,
  };
}

// ── Job APIs ──────────────────────────────────────────────────────────────────

export async function getJobById(jobId: string): Promise<GenerationJob> {
  const res = await apiFetch<ApiResponse<GenerationJob>>('/api/jobs/' + jobId);
  return res.data;
}

export async function getJobByAssignmentId(
  assignmentId: string
): Promise<GenerationJob | null> {
  try {
    const res = await apiFetch<ApiResponse<GenerationJob>>(
      '/api/jobs/assignment/' + assignmentId
    );
    return res.data;
  } catch {
    return null;
  }
}

// ── Result APIs ───────────────────────────────────────────────────────────────

export async function getResultByAssignmentId(
  assignmentId: string
): Promise<GeneratedPaper | null> {
  try {
    const res = await apiFetch<ApiResponse<GeneratedPaper>>(
      '/api/results/' + assignmentId
    );
    return res.data;
  } catch {
    return null;
  }
}

export async function regeneratePaper(
  assignmentId: string
): Promise<GeneratedPaper> {
  const res = await apiFetch<ApiResponse<GeneratedPaper>>(
    '/api/results/' + assignmentId + '/regenerate',
    { method: 'POST' }
  );
  return res.data;
}

export async function regenerateSection(
  assignmentId: string,
  sectionTitle: string
): Promise<GeneratedPaper> {
  const res = await apiFetch<ApiResponse<GeneratedPaper>>(
    '/api/results/' + assignmentId + '/regenerate-section',
    {
      method: 'POST',
      body:   JSON.stringify({ sectionTitle }),
    }
  );
  return res.data;
}
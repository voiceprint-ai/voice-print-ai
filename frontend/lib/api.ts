/**
 * Typed API client for the Voiceprint backend.
 *
 * Every function here attaches the current Firebase ID token as a Bearer header
 * and mirrors the exact request/response shapes the backend validates and
 * returns (see backend/src/schemas/requests.ts and backend/src/llm/types.ts —
 * keep these two files in sync if either side changes).
 *
 * Set NEXT_PUBLIC_API_URL in .env.local to point at the backend
 * (http://localhost:8080 locally, the deployed Cloud Run URL in production).
 *
 * @author Saamarth Attray
 */
import { firebaseAuth } from "./firebase";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

// --- Types mirrored from the backend (backend/src/llm/types.ts) ---

export interface VoiceProfile {
  summary: string;
  tone: string;
  sentenceStructure: string;
  vocabulary: string;
  quirks: string[];
  avoids: string[];
}

export interface AnalysisResult {
  overallScore: number;
  dimensions: {
    tone: number;
    sentenceStructure: number;
    vocabulary: number;
    quirks: number;
  };
  driftNotes: string[];
  summary: string;
}

export interface RewriteResult {
  rewritten: string;
  changeNotes: string[];
}

export interface Project {
  id: string;
  ownerUid: string;
  name: string;
  sampleCount: number;
  voiceProfile: VoiceProfile | null;
  profileGeneratedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface Sample {
  id: string;
  title: string;
  text: string;
  charCount: number;
  createdAt: number;
}

/** Shape of every error response the backend returns (see backend/src/lib/errors.ts). */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId?: string;

  constructor(status: number, code: string, message: string, requestId?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

async function authHeader(): Promise<Record<string, string>> {
  const user = firebaseAuth.currentUser;
  if (!user) {
    throw new ApiError(401, "unauthenticated", "You must be signed in.");
  }
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

interface RequestOptions {
  method?: "GET" | "POST" | "DELETE";
  body?: unknown;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...(await authHeader()),
  };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_URL}${path}`, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const err = data?.error;
    throw new ApiError(
      res.status,
      err?.code ?? "unknown_error",
      err?.message ?? "Something went wrong",
      err?.requestId,
    );
  }

  return data as T;
}

// --- Projects ---

export function createProject(name: string): Promise<{ project: Project }> {
  return request("/v1/projects", { method: "POST", body: { name } });
}

export function listProjects(): Promise<{ projects: Project[] }> {
  return request("/v1/projects");
}

export function getProject(projectId: string): Promise<{ project: Project }> {
  return request(`/v1/projects/${projectId}`);
}

export function deleteProject(projectId: string): Promise<void> {
  return request(`/v1/projects/${projectId}`, { method: "DELETE" });
}

// --- Samples ---

export function addSample(
  projectId: string,
  title: string,
  text: string,
): Promise<{ sample: Sample }> {
  return request(`/v1/projects/${projectId}/samples`, {
    method: "POST",
    body: { title, text },
  });
}

export function listSamples(projectId: string): Promise<{ samples: Sample[] }> {
  return request(`/v1/projects/${projectId}/samples`);
}

export function deleteSample(projectId: string, sampleId: string): Promise<void> {
  return request(`/v1/projects/${projectId}/samples/${sampleId}`, { method: "DELETE" });
}

// --- Voice profile ---

export function generateProfile(projectId: string): Promise<{ profile: VoiceProfile }> {
  return request(`/v1/projects/${projectId}/profile`, { method: "POST" });
}

export function getProfile(
  projectId: string,
): Promise<{ profile: VoiceProfile | null }> {
  return request(`/v1/projects/${projectId}/profile`);
}

// --- Analyze / Rewrite ---

export function analyzeTarget(
  projectId: string,
  target: string,
): Promise<{ result: AnalysisResult }> {
  return request(`/v1/projects/${projectId}/analyze`, {
    method: "POST",
    body: { target },
  });
}

export function rewriteTarget(
  projectId: string,
  target: string,
  instructions?: string,
): Promise<{ result: RewriteResult }> {
  return request(`/v1/projects/${projectId}/rewrite`, {
    method: "POST",
    body: { target, instructions },
  });
}

// --- Account ---

export function deleteAccountData(): Promise<{ deleted: { projects: number } }> {
  return request("/v1/account/data", { method: "DELETE" });
}
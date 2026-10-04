import type { AnalysisResult, ApiErrorBody, InputType } from "./types";

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code = "unknown", status = 0) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

const FRIENDLY_NETWORK_ERROR =
  "Cannot reach the ScamLens backend. Make sure the dev server is running and try again.";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(path, init);
  } catch {
    throw new ApiError(FRIENDLY_NETWORK_ERROR, "network_error");
  }

  let body: unknown = null;
  const text = await response.text().catch(() => "");
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }

  if (!response.ok) {
    const errorBody = body as ApiErrorBody | null;
    const message = errorBody?.error ?? "The analysis request failed. Please try again.";
    const code = errorBody?.code ?? `http_${response.status}`;
    throw new ApiError(message, code, response.status);
  }

  if (!body) {
    throw new ApiError("The server returned an unexpected response.", "bad_response", response.status);
  }

  return body as T;
}

export function analyzeText(text: string): Promise<AnalysisResult> {
  return request<AnalysisResult>("/api/analyze/text", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
}

export function analyzeImage(file: File): Promise<AnalysisResult> {
  const form = new FormData();
  form.append("image", file);
  return request<AnalysisResult>("/api/analyze/image", {
    method: "POST",
    body: form,
  });
}

export function analyzeUrl(url: string): Promise<AnalysisResult> {
  return request<AnalysisResult>("/api/analyze/url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
}

export interface HealthStatus {
  status: "ok" | "degraded";
  ai: boolean;
  ocr: boolean;
  version: string;
}

export function getHealth(): Promise<HealthStatus> {
  return request<HealthStatus>("/api/health");
}

export const INPUT_LABELS: Record<InputType, string> = {
  text: "Message",
  image: "Screenshot",
  url: "URL",
};

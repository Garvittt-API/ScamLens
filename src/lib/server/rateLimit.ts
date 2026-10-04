import { RequestError } from "./http";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;
const MAX_KEYS = 500;

const hits = new Map<string, number[]>();

function prune(key: string, now: number): number[] {
  const timestamps = (hits.get(key) ?? []).filter((entry) => now - entry < WINDOW_MS);
  if (timestamps.length === 0) hits.delete(key);
  else hits.set(key, timestamps);
  return timestamps;
}

/**
 * Simple in-memory sliding-window limiter.
 * Prototype-grade: per server instance, no durable storage.
 */
export function enforceRateLimit(req: Request): void {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "local";
  const now = Date.now();

  if (hits.size > MAX_KEYS) hits.clear();

  const timestamps = prune(ip, now);
  if (timestamps.length >= MAX_REQUESTS) {
    throw new RequestError(
      "Too many analysis requests. Please wait a moment and try again.",
      "rate_limited",
      429,
    );
  }

  timestamps.push(now);
  hits.set(ip, timestamps);
}

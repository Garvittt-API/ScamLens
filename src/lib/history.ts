import { HISTORY_MAX_ITEMS, HISTORY_STORAGE_KEY } from "./constants";
import type { AnalysisResult, InputType, RiskLevel } from "./types";

/**
 * Privacy-friendly local history.
 * Only a short summary, risk metadata, and signal titles are stored —
 * never raw messages, screenshots, extracted text, or evidence excerpts.
 * Storage is opt-in (explicit user action) and lives only in this browser.
 */
export interface HistoryEntry {
  id: string;
  created_at: string;
  input_type: InputType;
  risk_level: RiskLevel;
  risk_score: number;
  summary: string;
  signal_titles: string[];
}

const EMPTY: HistoryEntry[] = [];
const INPUT_TYPES = new Set<string>(["text", "image", "url"]);
const RISK_LEVELS = new Set<string>(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

export function subscribeHistory(listener: () => void): () => void {
  listeners.add(listener);
  if (isBrowser()) {
    const onStorage = () => notify();
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  }
  return () => {
    listeners.delete(listener);
  };
}

function isHistoryEntry(value: unknown): value is HistoryEntry {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.id === "string" &&
    entry.id.length > 0 &&
    typeof entry.summary === "string" &&
    typeof entry.risk_score === "number" &&
    Number.isFinite(entry.risk_score) &&
    typeof entry.risk_level === "string" &&
    RISK_LEVELS.has(entry.risk_level) &&
    typeof entry.input_type === "string" &&
    INPUT_TYPES.has(entry.input_type) &&
    typeof entry.created_at === "string" &&
    !Number.isNaN(Date.parse(entry.created_at)) &&
    Array.isArray(entry.signal_titles) &&
    entry.signal_titles.every((title) => typeof title === "string")
  );
}

/**
 * Cached snapshot: useSyncExternalStore REQUIRES a stable reference between
 * changes — returning a fresh array on every read makes React throw
 * "The result of getSnapshot should be cached to avoid an infinite loop".
 * The cache is invalidated only when the raw stored string changes.
 */
let cachedRaw: string | null = null;
let cachedSnapshot: HistoryEntry[] = EMPTY;
let cachePrimed = false;

export function loadHistory(): HistoryEntry[] {
  if (!isBrowser()) return EMPTY;

  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
  } catch {
    return EMPTY;
  }

  if (cachePrimed && raw === cachedRaw) return cachedSnapshot;

  cachedRaw = raw;
  cachePrimed = true;

  if (!raw) {
    cachedSnapshot = EMPTY;
    return EMPTY;
  }

  try {
    const parsed = JSON.parse(raw);
    cachedSnapshot = Array.isArray(parsed) ? parsed.filter(isHistoryEntry) : EMPTY;
  } catch {
    cachedSnapshot = EMPTY;
  }
  return cachedSnapshot;
}

export function getHistorySnapshot(): HistoryEntry[] {
  return loadHistory();
}

export function getHistoryServerSnapshot(): HistoryEntry[] {
  return EMPTY;
}

function persist(entries: HistoryEntry[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    /* storage full or blocked — history is best-effort */
  }
  notify();
}

export function saveToHistory(result: AnalysisResult): HistoryEntry {
  const entry: HistoryEntry = {
    id: result.id,
    created_at: result.created_at,
    input_type: result.input_type,
    risk_level: result.risk_level,
    risk_score: result.risk_score,
    summary: result.summary.slice(0, 200),
    signal_titles: [...new Set(result.signals.map((signal) => signal.title))].slice(0, 8),
  };

  const next = [entry, ...loadHistory().filter((existing) => existing.id !== entry.id)].slice(
    0,
    HISTORY_MAX_ITEMS,
  );
  persist(next);
  return entry;
}

export function isSaved(id: string): boolean {
  return loadHistory().some((entry) => entry.id === id);
}

export function removeHistoryEntry(id: string): void {
  persist(loadHistory().filter((entry) => entry.id !== id));
}

export function clearHistory(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch {
    /* ignore */
  }
  notify();
}

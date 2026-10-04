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
  return () => listeners.delete(listener);
}

export function getHistorySnapshot(): HistoryEntry[] {
  return loadHistory();
}

export function getHistoryServerSnapshot(): HistoryEntry[] {
  return [];
}

export function loadHistory(): HistoryEntry[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is HistoryEntry =>
        typeof entry === "object" &&
        entry !== null &&
        typeof entry.id === "string" &&
        typeof entry.summary === "string" &&
        typeof entry.risk_score === "number",
    );
  } catch {
    return [];
  }
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
    signal_titles: result.signals.map((signal) => signal.title).slice(0, 8),
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

import { afterEach, describe, expect, it, vi } from "vitest";
import { HISTORY_MAX_ITEMS, HISTORY_STORAGE_KEY } from "@/lib/constants";
import {
  clearHistory,
  getHistoryServerSnapshot,
  getHistorySnapshot,
  isSaved,
  loadHistory,
  removeHistoryEntry,
  saveToHistory,
  subscribeHistory,
} from "@/lib/history";
import type { AnalysisResult, Signal } from "@/lib/types";

function installWindow(initial?: Record<string, string>): void {
  const store = new Map<string, string>(Object.entries(initial ?? {}));
  const localStorage = {
    getItem: (key: string) => (store.has(key) ? (store.get(key) as string) : null),
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
  };
  Object.defineProperty(globalThis, "window", {
    value: { localStorage, addEventListener: () => {}, removeEventListener: () => {} },
    configurable: true,
    writable: true,
  });
}

afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
  vi.restoreAllMocks();
});

function makeResult(overrides: Partial<AnalysisResult> = {}): AnalysisResult {
  return {
    id: "result-1",
    input_type: "text",
    risk_score: 55,
    risk_level: "HIGH",
    summary: "Bank OTP scam asking for immediate verification.",
    signals: [{ title: "Requests an OTP" } as Signal],
    evidence: [],
    explanation: "",
    recommended_actions: [],
    extracted_text: "",
    language: "en",
    ai_available: false,
    confidence_note: "",
    created_at: "2026-10-04T12:00:00.000Z",
    ...overrides,
  };
}

describe("history snapshot stability (useSyncExternalStore contract)", () => {
  it("returns the same array reference while storage is unchanged (empty)", () => {
    installWindow();
    const first = getHistorySnapshot();
    const second = getHistorySnapshot();
    expect(second).toBe(first);
    expect(first).toEqual([]);
  });

  it("returns the same array reference while storage is unchanged (with data)", () => {
    installWindow({
      [HISTORY_STORAGE_KEY]: JSON.stringify([
        {
          id: "a",
          created_at: "2026-10-04T12:00:00.000Z",
          input_type: "text",
          risk_level: "LOW",
          risk_score: 0,
          summary: "ok",
          signal_titles: [],
        },
      ]),
    });
    const first = getHistorySnapshot();
    const second = getHistorySnapshot();
    expect(second).toBe(first);
    expect(first).toHaveLength(1);
  });

  it("server snapshot is a stable empty reference", () => {
    expect(getHistoryServerSnapshot()).toBe(getHistoryServerSnapshot());
    expect(getHistoryServerSnapshot()).toEqual([]);
  });

  it("returns a fresh reference only after storage changes", () => {
    installWindow();
    const before = getHistorySnapshot();
    saveToHistory(makeResult());
    const after = getHistorySnapshot();
    expect(after).not.toBe(before);
    expect(after).toHaveLength(1);
    expect(getHistorySnapshot()).toBe(after);
  });
});

describe("save / remove / clear", () => {
  it("persists a privacy-safe entry and isSaved finds it", () => {
    installWindow();
    const entry = saveToHistory(
      makeResult({
        summary: "x".repeat(300),
        signals: [
          { title: "One" } as Signal,
          { title: "Two" } as Signal,
          { title: "One" } as Signal,
        ],
      }),
    );
    expect(entry.summary).toHaveLength(200);
    expect(entry.signal_titles).toEqual(["One", "Two"]);
    expect(isSaved("result-1")).toBe(true);
    expect(loadHistory()).toHaveLength(1);
  });

  it("does not duplicate the same result id", () => {
    installWindow();
    saveToHistory(makeResult());
    saveToHistory(makeResult());
    expect(loadHistory()).toHaveLength(1);
  });

  it("caps stored entries at HISTORY_MAX_ITEMS, newest first", () => {
    installWindow();
    for (let i = 0; i < HISTORY_MAX_ITEMS + 5; i++) {
      saveToHistory(makeResult({ id: `result-${i}` }));
    }
    const entries = loadHistory();
    expect(entries).toHaveLength(HISTORY_MAX_ITEMS);
    expect(entries[0]?.id).toBe(`result-${HISTORY_MAX_ITEMS + 4}`);
  });

  it("notifies subscribers on save and remove; stops after unsubscribe", () => {
    installWindow();
    const listener = vi.fn();
    const unsubscribe = subscribeHistory(listener);

    saveToHistory(makeResult());
    expect(listener).toHaveBeenCalledTimes(1);

    removeHistoryEntry("result-1");
    expect(listener).toHaveBeenCalledTimes(2);
    expect(loadHistory()).toHaveLength(0);

    unsubscribe();
    saveToHistory(makeResult());
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("clearHistory empties storage and notifies", () => {
    installWindow();
    const listener = vi.fn();
    subscribeHistory(listener);
    saveToHistory(makeResult());
    clearHistory();
    expect(loadHistory()).toHaveLength(0);
    expect(listener).toHaveBeenCalledTimes(2);
  });
});

describe("corrupt or invalid stored data", () => {
  it("tolerates invalid JSON without throwing", () => {
    installWindow({ [HISTORY_STORAGE_KEY]: "{not json" });
    expect(getHistorySnapshot()).toEqual([]);
    expect(getHistorySnapshot()).toBe(getHistorySnapshot());
  });

  it("tolerates non-array JSON", () => {
    installWindow({ [HISTORY_STORAGE_KEY]: JSON.stringify({ hello: "world" }) });
    expect(getHistorySnapshot()).toEqual([]);
  });

  it("filters entries that would crash the history view", () => {
    installWindow({
      [HISTORY_STORAGE_KEY]: JSON.stringify([
        null,
        "string-entry",
        { id: "bad-input-type", summary: "s", risk_score: 10, input_type: "carrier-pigeon" },
        { id: "missing-signals", summary: "s", risk_score: 10, input_type: "text" },
        { id: "bad-level", summary: "s", risk_score: 10, input_type: "url", risk_level: "SEVERE" },
        { id: "bad-date", summary: "s", risk_score: 10, input_type: "text", risk_level: "LOW" },
        {
          id: "valid",
          created_at: "2026-10-04T12:00:00.000Z",
          input_type: "image",
          risk_level: "CRITICAL",
          risk_score: 85,
          summary: "valid",
          signal_titles: ["a"],
        },
      ]),
    });
    const entries = getHistorySnapshot();
    expect(entries).toHaveLength(1);
    expect(entries[0]?.id).toBe("valid");
    expect(entries[0]?.input_type).toBe("image");
    expect(entries[0]?.signal_titles).toEqual(["a"]);
  });
});

import { describe, expect, it } from "vitest";
import { runAnalysis } from "@/lib/pipeline/analyze";
import type { AIProvider } from "@/lib/ai/contract";
import type { AIContext, RiskLevel } from "@/lib/types";
import { DEMO_MESSAGE, LEGIT_DATASET, SCAM_DATASET } from "@/lib/testdata/dataset";

const offlineProvider: AIProvider = {
  name: "offline-test",
  isAvailable: () => false,
  analyze: async () => null,
};

const validAiContext: AIContext = {
  summary: "AI summary of the analysis.",
  intent: "Steal banking credentials",
  language: "en",
  additional_signals: [],
  explanation: "AI explanation referencing the wording of the message.",
  recommended_actions: [
    { priority: "critical", action: "Never share an OTP with anyone." },
    { priority: "medium", action: "Check the sender in the official app." },
  ],
  confidence_note: "AI confidence note.",
  available: true,
};

const workingProvider: AIProvider = {
  name: "working-test",
  isAvailable: () => true,
  analyze: async () => validAiContext,
};

const brokenProvider: AIProvider = {
  name: "broken-test",
  isAvailable: () => true,
  analyze: async () => {
    throw new Error("provider exploded");
  },
};

const invalidProvider: AIProvider = {
  name: "invalid-test",
  isAvailable: () => true,
  analyze: async () => null,
};

const LEVEL_RANK: Record<RiskLevel, number> = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 };

describe("runAnalysis (text pipeline)", () => {
  it("produces the normalized AnalysisResult shape", async () => {
    const result = await runAnalysis({
      inputType: "text",
      content: DEMO_MESSAGE,
      provider: offlineProvider,
    });

    expect(result.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(result.input_type).toBe("text");
    expect(typeof result.risk_score).toBe("number");
    expect(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).toContain(result.risk_level);
    expect(result.summary.length).toBeGreaterThan(0);
    expect(result.explanation.length).toBeGreaterThan(0);
    expect(result.signals.length).toBeGreaterThan(0);
    expect(result.evidence.length).toBeGreaterThan(0);
    expect(result.recommended_actions.length).toBeGreaterThanOrEqual(4);
    expect(result.extracted_text).toBe(DEMO_MESSAGE);
    expect(result.language).toBe("en");
    expect(result.ai_available).toBe(false);
    expect(Number.isNaN(Date.parse(result.created_at))).toBe(false);
  });

  it("scores the demo message HIGH", async () => {
    const result = await runAnalysis({
      inputType: "text",
      content: DEMO_MESSAGE,
      provider: offlineProvider,
    });
    expect(result.risk_level).toBe("HIGH");
    expect(result.risk_score).toBe(55);
  });

  it("keeps every scam dataset item at MEDIUM or above", async () => {
    for (const item of SCAM_DATASET) {
      const result = await runAnalysis({
        inputType: "text",
        content: item.text,
        provider: offlineProvider,
      });
      expect(LEVEL_RANK[result.risk_level], `${item.id} scored ${result.risk_score}`).toBeGreaterThanOrEqual(
        LEVEL_RANK.MEDIUM,
      );
    }
  });

  it("keeps every legitimate dataset item at LOW", async () => {
    for (const item of LEGIT_DATASET) {
      const result = await runAnalysis({
        inputType: "text",
        content: item.text,
        provider: offlineProvider,
      });
      expect(result.risk_level, `${item.id} scored ${result.risk_score}`).toBe("LOW");
    }
  });

  it("uses AI output when the provider works", async () => {
    const result = await runAnalysis({
      inputType: "text",
      content: DEMO_MESSAGE,
      provider: workingProvider,
    });

    expect(result.ai_available).toBe(true);
    expect(result.summary).toBe("AI summary of the analysis.");
    expect(result.explanation).toBe("AI explanation referencing the wording of the message.");
    expect(result.confidence_note).toBe("AI confidence note.");
    expect(result.recommended_actions.some((action) => action.action === "Never share an OTP with anyone.")).toBe(
      true,
    );
  });

  it("falls back to deterministic output when the provider throws", async () => {
    const result = await runAnalysis({
      inputType: "text",
      content: DEMO_MESSAGE,
      provider: brokenProvider,
    });

    expect(result.ai_available).toBe(false);
    expect(result.explanation.length).toBeGreaterThan(20);
    expect(result.recommended_actions.length).toBeGreaterThan(0);
    expect(result.risk_score).toBe(55);
  });

  it("falls back when the provider returns null (invalid or unavailable AI)", async () => {
    const result = await runAnalysis({
      inputType: "text",
      content: DEMO_MESSAGE,
      provider: invalidProvider,
    });

    expect(result.ai_available).toBe(false);
    expect(result.summary.length).toBeGreaterThan(0);
  });

  it("still produces a sensible result with zero signals", async () => {
    const result = await runAnalysis({
      inputType: "text",
      content: "Lunch is at noon in the cafeteria.",
      provider: offlineProvider,
    });

    expect(result.risk_level).toBe("LOW");
    expect(result.risk_score).toBe(0);
    expect(result.signals).toEqual([]);
    expect(result.recommended_actions.length).toBeGreaterThan(0);
    expect(result.explanation.length).toBeGreaterThan(0);
  });

  it("includes extra signals (URL mode) in scoring", async () => {
    const result = await runAnalysis({
      inputType: "url",
      content: "https://example.com/",
      extraSignals: [
        {
          id: "url_shortener",
          category: "suspicious_url",
          severity: "high",
          title: "Link shortener",
          evidence: "https://example.com/",
          explanation: "test",
        },
      ],
      provider: offlineProvider,
    });

    expect(result.risk_score).toBe(20);
    expect(result.signals.some((signal) => signal.id === "url_shortener")).toBe(true);
  });
});

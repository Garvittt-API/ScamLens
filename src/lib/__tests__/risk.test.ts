import { describe, expect, it } from "vitest";
import { scoreSignals } from "@/lib/risk/engine";
import { RISK_THRESHOLDS, RISK_WEIGHTS, levelForScore } from "@/lib/risk/config";
import { detectSignals } from "@/lib/signals/engine";
import { DEMO_MESSAGE } from "@/lib/testdata/dataset";
import type { Signal } from "@/lib/types";

function fakeSignal(category: Signal["category"], id = `test_${category}`): Signal {
  return {
    id,
    category,
    severity: "high",
    title: id,
    evidence: "evidence",
    explanation: "explanation",
  };
}

describe("risk config", () => {
  it("uses the documented prototype weights", () => {
    expect(RISK_WEIGHTS.credential_request).toBe(20);
    expect(RISK_WEIGHTS.financial_request).toBe(20);
    expect(RISK_WEIGHTS.suspicious_url).toBe(20);
    expect(RISK_WEIGHTS.impersonation).toBe(15);
    expect(RISK_WEIGHTS.urgency).toBe(10);
    expect(RISK_WEIGHTS.threat).toBe(10);
    expect(RISK_WEIGHTS.reward_lure).toBe(10);
    expect(RISK_WEIGHTS.other).toBe(0);
  });
});

describe("levelForScore", () => {
  it("maps thresholds to bands", () => {
    expect(levelForScore(0)).toBe("LOW");
    expect(levelForScore(RISK_THRESHOLDS.MEDIUM - 1)).toBe("LOW");
    expect(levelForScore(RISK_THRESHOLDS.MEDIUM)).toBe("MEDIUM");
    expect(levelForScore(RISK_THRESHOLDS.HIGH - 1)).toBe("MEDIUM");
    expect(levelForScore(RISK_THRESHOLDS.HIGH)).toBe("HIGH");
    expect(levelForScore(RISK_THRESHOLDS.CRITICAL - 1)).toBe("HIGH");
    expect(levelForScore(RISK_THRESHOLDS.CRITICAL)).toBe("CRITICAL");
    expect(levelForScore(100)).toBe("CRITICAL");
  });
});

describe("scoreSignals", () => {
  it("scores the demo message as HIGH at 55", () => {
    const signals = detectSignals(DEMO_MESSAGE);
    const assessment = scoreSignals(signals);

    expect(assessment.score).toBe(55);
    expect(assessment.level).toBe("HIGH");
  });

  it("counts each category only once", () => {
    const signals = [fakeSignal("credential_request", "a"), fakeSignal("credential_request", "b")];
    expect(scoreSignals(signals).score).toBe(RISK_WEIGHTS.credential_request);
  });

  it("ignores zero-weight categories", () => {
    expect(scoreSignals([fakeSignal("other")]).score).toBe(0);
    expect(scoreSignals([fakeSignal("other")]).level).toBe("LOW");
  });

  it("caps the score at 100", () => {
    const signals = [
      fakeSignal("credential_request"),
      fakeSignal("financial_request"),
      fakeSignal("suspicious_url"),
      fakeSignal("impersonation"),
      fakeSignal("urgency"),
      fakeSignal("threat"),
      fakeSignal("reward_lure"),
    ];
    const assessment = scoreSignals(signals);
    expect(assessment.score).toBe(100);
    expect(assessment.level).toBe("CRITICAL");
  });

  it("returns zero for no signals", () => {
    expect(scoreSignals([])).toMatchObject({ score: 0, level: "LOW" });
  });

  it("orders contributions by value descending", () => {
    const signals = [fakeSignal("urgency"), fakeSignal("credential_request")];
    const { contributions } = scoreSignals(signals);
    expect(contributions[0].category).toBe("credential_request");
    expect(contributions[0].value).toBe(20);
  });
});

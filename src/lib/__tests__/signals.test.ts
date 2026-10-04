import { describe, expect, it } from "vitest";
import { buildEvidence, detectSignals } from "@/lib/signals/engine";
import { DEMO_MESSAGE, LEGIT_DATASET, SCAM_DATASET } from "@/lib/testdata/dataset";

describe("detectSignals", () => {
  it("detects the four expected categories for the demo message", () => {
    const signals = detectSignals(DEMO_MESSAGE);
    const categories = signals.map((signal) => signal.category);

    expect(categories).toContain("urgency");
    expect(categories).toContain("credential_request");
    expect(categories).toContain("impersonation");
    expect(categories).toContain("threat");
  });

  it("captures evidence sentences, not just keywords", () => {
    const signals = detectSignals(DEMO_MESSAGE);
    const credential = signals.find((signal) => signal.category === "credential_request");

    expect(credential).toBeDefined();
    expect(credential?.evidence.toLowerCase()).toContain("otp");
    expect(credential?.evidence.length).toBeGreaterThan(10);
    expect(credential?.explanation.length).toBeGreaterThan(10);
  });

  it("is case-insensitive", () => {
    const lower = detectSignals("please send your otp now");
    const upper = detectSignals("PLEASE SEND YOUR OTP NOW");
    expect(lower.length).toBeGreaterThan(0);
    expect(lower.map((s) => s.id)).toEqual(upper.map((s) => s.id));
  });

  it("returns no signals for empty input", () => {
    expect(detectSignals("")).toEqual([]);
    expect(detectSignals("   \n ")).toEqual([]);
  });

  it("respects word boundaries (pin inside shopping does not match)", () => {
    const signals = detectSignals("I went shopping for clothes today");
    expect(signals.some((signal) => signal.id === "credential_request")).toBe(false);
  });

  it("matches hyphenated variants of multi-word phrases", () => {
    const signals = detectSignals("Please provide the one-time password to continue");
    expect(signals.some((signal) => signal.category === "credential_request")).toBe(true);
  });

  it("finds no credential or threat signals in the college announcement", () => {
    const college = LEGIT_DATASET.find((item) => item.id === "college");
    const signals = detectSignals(college?.text ?? "");
    expect(signals.map((signal) => signal.category)).not.toContain("credential_request");
    expect(signals.map((signal) => signal.category)).not.toContain("threat");
  });

  it("detects at least one signal in every scam dataset item", () => {
    for (const item of SCAM_DATASET) {
      expect(detectSignals(item.text).length, item.id).toBeGreaterThan(0);
    }
  });
});

describe("buildEvidence", () => {
  it("groups signals that share the same excerpt", () => {
    const signals = detectSignals(DEMO_MESSAGE);
    const evidence = buildEvidence(signals);

    expect(evidence.length).toBeGreaterThan(0);
    for (const item of evidence) {
      expect(item.excerpt.length).toBeGreaterThan(0);
      expect(item.signalIds.length).toBeGreaterThan(0);
      for (const id of item.signalIds) {
        expect(signals.some((signal) => signal.id === id)).toBe(true);
      }
    }
  });
});

import { describe, expect, it } from "vitest";
import { parseAIResponse } from "@/lib/ai/schema";

const VALID = {
  summary: "This message pressures you to share an OTP.",
  intent: "Steal banking credentials",
  language: "en",
  additional_signals: ["authority impersonation"],
  explanation: "The message creates urgency and asks for an OTP, which is a classic phishing pattern.",
  recommended_actions: [
    { priority: "critical", action: "Do not share your OTP." },
    { priority: "medium", action: "Verify through the official app." },
  ],
  confidence_note: "Wording is typical of phishing.",
};

describe("parseAIResponse", () => {
  it("parses a valid JSON string", () => {
    const result = parseAIResponse(JSON.stringify(VALID));
    expect(result).not.toBeNull();
    expect(result?.summary).toContain("OTP");
    expect(result?.recommended_actions).toHaveLength(2);
    expect(result?.available).toBe(true);
  });

  it("parses JSON wrapped in markdown code fences", () => {
    const result = parseAIResponse("```json\n" + JSON.stringify(VALID) + "\n```");
    expect(result?.language).toBe("en");
  });

  it("parses an already-decoded object", () => {
    expect(parseAIResponse(VALID)?.intent).toBe("Steal banking credentials");
  });

  it("returns null for malformed JSON", () => {
    expect(parseAIResponse("{not json")).toBeNull();
    expect(parseAIResponse("the model refused")).toBeNull();
  });

  it("returns null when both summary and explanation are missing", () => {
    expect(parseAIResponse(JSON.stringify({ language: "en" }))).toBeNull();
    expect(parseAIResponse("{}")).toBeNull();
    expect(parseAIResponse(null)).toBeNull();
    expect(parseAIResponse([1, 2, 3])).toBeNull();
  });

  it("coerces missing fields to safe defaults", () => {
    const result = parseAIResponse(JSON.stringify({ explanation: "Suspicious wording." }));
    expect(result).not.toBeNull();
    expect(result?.summary).toBe("");
    expect(result?.language).toBe("en");
    expect(result?.recommended_actions).toEqual([]);
    expect(result?.additional_signals).toEqual([]);
  });

  it("rejects invalid language codes", () => {
    const result = parseAIResponse(JSON.stringify({ ...VALID, language: "<script>" }));
    expect(result?.language).toBe("en");
  });

  it("coerces invalid action priorities to medium", () => {
    const result = parseAIResponse(
      JSON.stringify({
        ...VALID,
        recommended_actions: [{ priority: "urgent!", action: "Do the thing" }],
      }),
    );
    expect(result?.recommended_actions[0].priority).toBe("medium");
  });

  it("caps the number of actions at 8 and drops empties", () => {
    const actions = Array.from({ length: 20 }, (_, index) => ({
      priority: "high",
      action: `Action ${index}`,
    }));
    actions.push({ priority: "high", action: "" });

    const result = parseAIResponse(JSON.stringify({ ...VALID, recommended_actions: actions }));
    expect(result?.recommended_actions).toHaveLength(8);
  });

  it("does not crash on wrong field types", () => {
    const result = parseAIResponse(
      JSON.stringify({ summary: { nested: true }, explanation: "Still a valid sentence.", recommended_actions: "none" }),
    );
    expect(result).not.toBeNull();
    expect(result?.summary).toBe("");
    expect(result?.recommended_actions).toEqual([]);
  });
});

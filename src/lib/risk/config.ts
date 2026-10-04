import type { RiskLevel, SignalCategory } from "@/lib/types";

/**
 * Prototype weights for the transparent risk score.
 * Configurable on purpose — these are heuristics for the hackathon prototype,
 * not validated probabilities.
 */
export const RISK_WEIGHTS: Record<SignalCategory, number> = {
  credential_request: 20,
  financial_request: 20,
  suspicious_url: 20,
  impersonation: 15,
  urgency: 10,
  threat: 10,
  reward_lure: 10,
  other: 0,
};

export const RISK_THRESHOLDS: Record<Exclude<RiskLevel, "LOW">, number> = {
  MEDIUM: 25,
  HIGH: 50,
  CRITICAL: 75,
};

export const SCORE_CAP = 100;

export function levelForScore(score: number): RiskLevel {
  if (score >= RISK_THRESHOLDS.CRITICAL) return "CRITICAL";
  if (score >= RISK_THRESHOLDS.HIGH) return "HIGH";
  if (score >= RISK_THRESHOLDS.MEDIUM) return "MEDIUM";
  return "LOW";
}

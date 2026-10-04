import { RISK_THRESHOLDS, SCORE_CAP, RISK_WEIGHTS, levelForScore } from "./config";
import type { RiskLevel, Signal } from "@/lib/types";

export interface RiskAssessment {
  score: number;
  level: RiskLevel;
  contributions: { category: Signal["category"]; label: string; value: number }[];
}

const CATEGORY_LABELS: Record<Signal["category"], string> = {
  credential_request: "Credential request",
  financial_request: "Financial request",
  suspicious_url: "Suspicious URL",
  impersonation: "Impersonation",
  urgency: "Urgency",
  threat: "Threat",
  reward_lure: "Reward / lure",
  other: "Other",
};

/**
 * Transparent scoring: sum of weights for DISTINCT detected categories, capped at 100.
 * The score is a heuristic, never a validated probability.
 */
export function scoreSignals(signals: Signal[]): RiskAssessment {
  const distinct = new Map<Signal["category"], number>();

  for (const signal of signals) {
    if (distinct.has(signal.category)) continue;
    const weight = RISK_WEIGHTS[signal.category] ?? 0;
    if (weight > 0) distinct.set(signal.category, weight);
  }

  const contributions = [...distinct.entries()]
    .map(([category, value]) => ({ category, label: CATEGORY_LABELS[category], value }))
    .sort((a, b) => b.value - a.value);

  const raw = contributions.reduce((total, item) => total + item.value, 0);
  const score = Math.max(0, Math.min(SCORE_CAP, raw));

  return { score, level: levelForScore(score), contributions };
}

export function riskBandFor(level: RiskLevel): string {
  if (level === "LOW") return `0–${RISK_THRESHOLDS.MEDIUM - 1}`;
  if (level === "MEDIUM") return `${RISK_THRESHOLDS.MEDIUM}–${RISK_THRESHOLDS.HIGH - 1}`;
  if (level === "HIGH") return `${RISK_THRESHOLDS.HIGH}–${RISK_THRESHOLDS.CRITICAL - 1}`;
  return `${RISK_THRESHOLDS.CRITICAL}–${SCORE_CAP}`;
}

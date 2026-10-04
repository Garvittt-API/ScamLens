import { buildEvidence, detectSignals } from "@/lib/signals/engine";
import { scoreSignals } from "@/lib/risk/engine";
import {
  buildDeterministicExplanation,
  buildDeterministicSummary,
  buildRecommendedActions,
} from "@/lib/actions";
import { getAIProvider } from "@/lib/ai/provider";
import type { AIProvider } from "@/lib/ai/contract";
import type {
  AIContext,
  AnalysisResult,
  InputType,
  RecommendedAction,
  Signal,
} from "@/lib/types";

export interface PipelineInput {
  inputType: InputType;
  /** Text scanned by the deterministic engine (message text, extracted OCR text, or the URL). */
  content: string;
  /** Text shown to the user alongside the result (defaults to content). */
  displayText?: string;
  /** Extra signals from specialised analysers (e.g. static URL inspection). */
  extraSignals?: Signal[];
  /** Injectable for tests; defaults to the environment-configured provider. */
  provider?: AIProvider;
}

function mergeSignals(detected: Signal[], extra: Signal[]): Signal[] {
  const merged = [...detected];
  const seen = new Set(detected.map((signal) => signal.id));
  for (const signal of extra) {
    if (seen.has(signal.id)) continue;
    seen.add(signal.id);
    merged.push(signal);
  }
  return merged;
}

const PRIORITY_RANK: Record<RecommendedAction["priority"], number> = {
  critical: 0,
  high: 1,
  medium: 2,
};

function mergeActions(
  baseline: RecommendedAction[],
  fromAi: RecommendedAction[],
): RecommendedAction[] {
  const seen = new Set(baseline.map((item) => item.action.toLowerCase()));
  const merged = [...baseline];

  for (const item of fromAi) {
    if (merged.length >= 8) break;
    const key = item.action.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }

  return merged
    .map((item, index) => ({ item, index }))
    .sort((a, b) => PRIORITY_RANK[a.item.priority] - PRIORITY_RANK[b.item.priority] || a.index - b.index)
    .map(({ item }) => item)
    .slice(0, 8);
}

/**
 * The single analysis format for every input type (spec §23).
 * extraction → deterministic signals → risk scoring → AI context → result.
 * Never throws because of AI failure: provider errors degrade to rule-only mode.
 */
export async function runAnalysis(input: PipelineInput): Promise<AnalysisResult> {
  const signals = mergeSignals(detectSignals(input.content), input.extraSignals ?? []);
  const assessment = scoreSignals(signals);

  const baselineSummary = buildDeterministicSummary(signals, assessment.level);
  const baselineExplanation = buildDeterministicExplanation(signals);
  const baselineActions = buildRecommendedActions(signals, assessment.level);

  const provider = input.provider ?? getAIProvider();
  let ai: AIContext | null = null;

  if (provider.isAvailable()) {
    try {
      ai = await provider.analyze({
        content: input.content,
        inputType: input.inputType,
        signals,
        score: assessment.score,
        level: assessment.level,
      });
    } catch {
      ai = null;
    }
  }

  return {
    id: crypto.randomUUID(),
    input_type: input.inputType,
    risk_score: assessment.score,
    risk_level: assessment.level,
    summary: ai?.summary || baselineSummary,
    signals,
    evidence: buildEvidence(signals),
    explanation: ai?.explanation || baselineExplanation,
    recommended_actions: mergeActions(baselineActions, ai?.recommended_actions ?? []),
    extracted_text: input.displayText ?? input.content,
    language: ai?.language || "en",
    ai_available: Boolean(ai),
    confidence_note: ai?.confidence_note || "",
    created_at: new Date().toISOString(),
  };
}

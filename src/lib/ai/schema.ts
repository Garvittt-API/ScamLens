import type { AIContext, RecommendedAction } from "@/lib/types";

const PRIORITIES: RecommendedAction["priority"][] = ["critical", "high", "medium"];
const MAX_ACTIONS = 8;
const MAX_ACTION_LENGTH = 220;
const MAX_EXPLANATION_LENGTH = 800;
const MAX_SUMMARY_LENGTH = 200;
const MAX_NOTE_LENGTH = 300;

function cleanString(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function parseActions(value: unknown): RecommendedAction[] {
  if (!Array.isArray(value)) return [];
  const actions: RecommendedAction[] = [];

  for (const entry of value) {
    if (actions.length >= MAX_ACTIONS) break;
    const raw = typeof entry === "string" ? entry : (entry as Record<string, unknown>)?.action;
    const action = cleanString(raw, MAX_ACTION_LENGTH);
    if (!action) continue;

    const rawPriority = typeof entry === "object" && entry !== null
      ? String((entry as Record<string, unknown>).priority ?? "")
      : "";
    const priority = PRIORITIES.includes(rawPriority as RecommendedAction["priority"])
      ? (rawPriority as RecommendedAction["priority"])
      : "medium";

    actions.push({ priority, action });
  }

  return actions;
}

function stripCodeFence(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1] : trimmed;
}

/**
 * Parses and validates structured AI output.
 * Returns null for invalid JSON or unusable content — callers must fall back gracefully.
 */
export function parseAIResponse(raw: unknown): AIContext | null {
  let payload: unknown = raw;

  if (typeof raw === "string") {
    try {
      payload = JSON.parse(stripCodeFence(raw));
    } catch {
      return null;
    }
  }

  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) return null;

  const record = payload as Record<string, unknown>;
  const summary = cleanString(record.summary, MAX_SUMMARY_LENGTH);
  const explanation = cleanString(record.explanation, MAX_EXPLANATION_LENGTH);
  const intent = cleanString(record.intent, 220);
  const confidenceNote = cleanString(record.confidence_note, MAX_NOTE_LENGTH);

  if (!explanation && !summary) return null;

  const languageRaw = cleanString(record.language, 12).toLowerCase();
  const language = /^[a-z]{2,3}([-_][a-z]{2,4})?$/.test(languageRaw) ? languageRaw.replace("_", "-") : "en";

  const additionalSignals = Array.isArray(record.additional_signals)
    ? record.additional_signals
        .map((entry) => cleanString(entry, 160))
        .filter(Boolean)
        .slice(0, 5)
    : [];

  return {
    summary,
    intent,
    language,
    additional_signals: additionalSignals,
    explanation,
    recommended_actions: parseActions(record.recommended_actions),
    confidence_note: confidenceNote,
    available: true,
  };
}

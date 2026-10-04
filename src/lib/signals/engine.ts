import { SIGNAL_PATTERNS, type SignalPattern } from "./patterns";
import type { Evidence, Signal } from "@/lib/types";

const MAX_SIGNALS = 14;
const EVIDENCE_MAX_LENGTH = 200;

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function patternRegex(pattern: SignalPattern): RegExp {
  const alternatives = pattern.phrases
    .map((phrase) =>
      phrase
        .trim()
        .split(/\s+/)
        .map(escapeRegex)
        .join("[-\\s]+"),
    )
    .map((alternative) => `(?<![A-Za-z0-9])${alternative}(?![A-Za-z0-9])`)
    .sort((a, b) => b.length - a.length)
    .join("|");
  return new RegExp(`(?:${alternatives})`, "i");
}

function isBoundary(text: string, index: number): boolean {
  const char = text[index];
  if (char === "\n") return true;
  if (char === "." || char === "!" || char === "?") {
    const next = text[index + 1];
    return next === undefined || /\s/.test(next);
  }
  return false;
}

function sentenceContaining(text: string, matchStart: number, matchLength: number): string {
  const matchEnd = matchStart + matchLength;

  let start = 0;
  for (let index = matchStart; index > 0; index -= 1) {
    if (isBoundary(text, index - 1)) {
      start = index;
      break;
    }
  }

  let end = text.length;
  for (let index = matchEnd; index < text.length; index += 1) {
    if (isBoundary(text, index)) {
      end = index + 1;
      break;
    }
  }

  const sentence = text.slice(start, end).replace(/\s+/g, " ").trim();
  if (sentence.length > EVIDENCE_MAX_LENGTH) {
    return `${sentence.slice(0, EVIDENCE_MAX_LENGTH - 1)}…`;
  }
  return sentence;
}

export function detectSignals(text: string): Signal[] {
  if (!text || !text.trim()) return [];

  const signals: Signal[] = [];

  for (const pattern of SIGNAL_PATTERNS) {
    if (signals.length >= MAX_SIGNALS) break;

    const match = patternRegex(pattern).exec(text);
    if (!match) continue;

    signals.push({
      id: pattern.id,
      category: pattern.category,
      severity: pattern.severity,
      title: pattern.title,
      evidence: sentenceContaining(text, match.index, match[0].length),
      explanation: pattern.explanation,
    });
  }

  return signals;
}

export function buildEvidence(signals: Signal[]): Evidence[] {
  const byExcerpt = new Map<string, Evidence>();

  for (const signal of signals) {
    const key = signal.evidence.toLowerCase();
    const existing = byExcerpt.get(key);
    if (existing) {
      if (!existing.signalIds.includes(signal.id)) existing.signalIds.push(signal.id);
      continue;
    }
    byExcerpt.set(key, {
      excerpt: signal.evidence,
      signalIds: [signal.id],
      note: "",
    });
  }

  return [...byExcerpt.values()];
}

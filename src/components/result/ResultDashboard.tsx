"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Camera,
  Flag,
  Gift,
  KeyRound,
  Landmark,
  Link2,
  MessageSquareText,
  ShieldAlert,
  Sparkles,
  Timer,
  TriangleAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { INPUT_LABELS } from "@/lib/api";
import { isSaved, saveToHistory } from "@/lib/history";
import { RISK_THRESHOLDS, RISK_WEIGHTS } from "@/lib/risk/config";
import type {
  AnalysisResult,
  RecommendedAction,
  RiskLevel,
  Severity,
  Signal,
  SignalCategory,
} from "@/lib/types";

const CATEGORY_META: Record<
  SignalCategory,
  { label: string; icon: typeof Timer; className: string }
> = {
  credential_request: { label: "Credential request", icon: KeyRound, className: "text-risk-critical" },
  financial_request: { label: "Financial request", icon: Landmark, className: "text-risk-high" },
  suspicious_url: { label: "Suspicious URL", icon: Link2, className: "text-risk-medium" },
  impersonation: { label: "Impersonation", icon: ShieldAlert, className: "text-[#a78bfa]" },
  urgency: { label: "Urgency", icon: Timer, className: "text-accent-400" },
  threat: { label: "Threat", icon: TriangleAlert, className: "text-risk-critical" },
  reward_lure: { label: "Reward / lure", icon: Gift, className: "text-risk-low" },
  other: { label: "Other", icon: Flag, className: "text-ink-300" },
};

const LEVEL_TONE: Record<RiskLevel, "low" | "medium" | "high" | "critical"> = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
};

const LEVEL_COLOR: Record<RiskLevel, string> = {
  LOW: "text-risk-low",
  MEDIUM: "text-risk-medium",
  HIGH: "text-risk-high",
  CRITICAL: "text-risk-critical",
};

const LEVEL_HEX: Record<RiskLevel, string> = {
  LOW: "#34d399",
  MEDIUM: "#fbbf24",
  HIGH: "#fb923c",
  CRITICAL: "#f43f5e",
};

const SEVERITY_LABEL: Record<Severity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

const PRIORITY_META: Record<RecommendedAction["priority"], { label: string; className: string }> = {
  critical: { label: "Do this now", className: "border-l-risk-critical" },
  high: { label: "Do this today", className: "border-l-risk-high" },
  medium: { label: "Good practice", className: "border-l-accent-400" },
};

const INPUT_ICON = {
  text: MessageSquareText,
  image: Camera,
  url: Link2,
} as const;

const RING_RADIUS = 52;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function ScoreRing({ score, level }: { score: number; level: RiskLevel }) {
  const offset = RING_CIRCUMFERENCE * (1 - Math.min(100, Math.max(0, score)) / 100);

  return (
    <div className="relative size-32 shrink-0">
      <svg viewBox="0 0 120 120" className="size-32 -rotate-90" aria-hidden="true">
        <circle cx="60" cy="60" r={RING_RADIUS} fill="none" stroke="#1b2740" strokeWidth="9" />
        <circle
          cx="60"
          cy="60"
          r={RING_RADIUS}
          fill="none"
          stroke={LEVEL_HEX[level]}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-4xl font-bold ${LEVEL_COLOR[level]}`}>{score}</span>
        <span className="mt-0.5 font-mono text-[10px] tracking-widest text-ink-500 uppercase">
          / 100
        </span>
      </div>
    </div>
  );
}

function RiskLegend({ score, level }: { score: number; level: RiskLevel }) {
  const markerLeft = `${Math.min(99.5, Math.max(0.5, score))}%`;

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium tracking-widest text-ink-500 uppercase">
          Risk Score (heuristic)
        </p>
        <p className="font-mono text-[11px] text-ink-500">
          thresholds {RISK_THRESHOLDS.MEDIUM} / {RISK_THRESHOLDS.HIGH} / {RISK_THRESHOLDS.CRITICAL}
        </p>
      </div>

      <div className="relative mt-3">
        <div className="flex h-2.5 overflow-hidden rounded-full">
          <div className="flex-1 bg-risk-low/70" />
          <div className="flex-1 bg-risk-medium/70" />
          <div className="flex-1 bg-risk-high/70" />
          <div className="flex-1 bg-risk-critical/70" />
        </div>
        <div
          className="absolute -top-1 h-4.5 w-1 -translate-x-1/2 rounded-full bg-ink-100 shadow-[0_0_0_2px_rgba(5,7,13,0.9)] transition-all duration-700"
          style={{ left: markerLeft }}
          aria-hidden="true"
        />
      </div>

      <div className="mt-2 grid grid-cols-4 text-center text-[10px] font-medium tracking-wider text-ink-500 uppercase">
        <span className={level === "LOW" ? "text-risk-low" : ""}>Low</span>
        <span className={level === "MEDIUM" ? "text-risk-medium" : ""}>Medium</span>
        <span className={level === "HIGH" ? "text-risk-high" : ""}>High</span>
        <span className={level === "CRITICAL" ? "text-risk-critical" : ""}>Critical</span>
      </div>
    </div>
  );
}

function categoryContributions(result: AnalysisResult): { category: SignalCategory; value: number }[] {
  const seen = new Map<SignalCategory, number>();
  for (const signal of result.signals) {
    if (signal.category === "other" || seen.has(signal.category)) continue;
    const weight = RISK_WEIGHTS[signal.category] ?? 0;
    if (weight > 0) seen.set(signal.category, weight);
  }
  return [...seen.entries()]
    .map(([category, value]) => ({ category, value }))
    .sort((a, b) => b.value - a.value);
}

export function ResultDashboard({
  result,
  onAnalyzeAnother,
}: {
  result: AnalysisResult;
  onAnalyzeAnother: () => void;
}) {
  const [saved, setSaved] = useState(() => isSaved(result.id));

  const levelTone = LEVEL_TONE[result.risk_level];
  const levelColor = LEVEL_COLOR[result.risk_level];
  const contributions = categoryContributions(result);
  const InputIcon = INPUT_ICON[result.input_type];
  const createdAt = new Date(result.created_at);

  function handleSave() {
    saveToHistory(result);
    setSaved(true);
  }

  return (
    <div className="animate-fade-in flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="accent">
            <InputIcon className="size-3" aria-hidden="true" />
            {INPUT_LABELS[result.input_type]} analysis
          </Badge>
          <Badge tone={levelTone}>{result.risk_level} risk</Badge>
          <span className="font-mono text-xs text-ink-500">
            {createdAt.toLocaleTimeString()} · id {result.id.slice(0, 8)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {saved ? (
            <Link href="/history">
              <Button variant="ghost" size="sm">
                <BookmarkCheck className="size-4 text-risk-low" aria-hidden="true" />
                Saved to history
              </Button>
            </Link>
          ) : (
            <Button variant="ghost" size="sm" onClick={handleSave}>
              <Bookmark className="size-4" aria-hidden="true" />
              Save summary
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={onAnalyzeAnother}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            Analyze another
          </Button>
        </div>
      </div>

      <section className="card p-6" aria-labelledby="risk-overview-title">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <div className="flex items-center gap-5">
            <ScoreRing score={result.risk_score} level={result.risk_level} />
            <div>
              <p className="text-xs tracking-widest text-ink-500 uppercase">Risk overview</p>
              <h2 id="risk-overview-title" className={`mt-1 text-3xl font-bold ${levelColor}`}>
                {result.risk_level} RISK
              </h2>
              <p className="mt-1.5 max-w-sm text-sm text-ink-400">{result.summary}</p>
            </div>
          </div>

          <div className="flex-1 lg:border-l lg:border-ink-700 lg:pl-6">
            <RiskLegend score={result.risk_score} level={result.risk_level} />

            <div className="mt-4 flex flex-wrap gap-2">
              {contributions.length === 0 ? (
                <p className="text-xs text-ink-500">
                  No weighted signals detected — score stays in the LOW band.
                </p>
              ) : (
                contributions.map((item) => {
                  const meta = CATEGORY_META[item.category];
                  return (
                    <span
                      key={item.category}
                      className="inline-flex items-center gap-1.5 rounded-md border border-ink-700 bg-ink-850 px-2.5 py-1 text-xs"
                    >
                      <meta.icon className={`size-3.5 ${meta.className}`} aria-hidden="true" />
                      <span className="text-ink-300">{meta.label}</span>
                      <span className={`font-mono font-semibold ${meta.className}`}>
                        +{item.value}
                      </span>
                    </span>
                  );
                })
              )}
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-ink-500">
              Score = weighted sum of distinct detected signals, capped at 100. It is a transparent
              heuristic, not a validated probability.
            </p>
          </div>
        </div>
      </section>

      <section className="card p-6" aria-labelledby="signals-title">
        <div className="flex items-center justify-between gap-3">
          <h2 id="signals-title" className="text-lg font-semibold text-ink-100">
            Detected signals
          </h2>
          <span className="font-mono text-xs text-ink-500">{result.signals.length} found</span>
        </div>

        {result.signals.length === 0 ? (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-ink-700 bg-ink-900 px-4 py-4">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-risk-low" aria-hidden="true" />
            <p className="text-sm text-ink-300">
              No scam indicators matched. This does not guarantee the message is safe — ScamLens
              checks for known patterns, not intent.
            </p>
          </div>
        ) : (
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {result.signals.map((signal: Signal) => {
              const meta = CATEGORY_META[signal.category];
              return (
                <li
                  key={signal.id}
                  className="flex gap-3 rounded-xl border border-ink-700 bg-ink-900 p-4"
                >
                  <span
                    className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-ink-700 bg-ink-850 ${meta.className}`}
                  >
                    <meta.icon className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-ink-100">{signal.title}</p>
                      <Badge tone={signal.severity as "low" | "medium" | "high" | "critical"}>
                        {SEVERITY_LABEL[signal.severity]}
                      </Badge>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-ink-400">
                      {signal.explanation}
                    </p>
                    <p className="mt-2 rounded-md bg-ink-850 px-2.5 py-1.5 font-mono text-[11px] break-words text-ink-300">
                      “{signal.evidence}”
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="card p-6" aria-labelledby="why-title">
        <h2 id="why-title" className="text-lg font-semibold text-ink-100">
          Why was this flagged?
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-300">{result.explanation}</p>

        {result.evidence.length > 0 ? (
          <div className="mt-5">
            <p className="text-xs font-medium tracking-widest text-ink-500 uppercase">
              Evidence map
            </p>
            <ul className="mt-3 flex flex-col gap-2.5">
              {result.evidence.map((item, index) => (
                <li
                  key={`${item.excerpt}-${index}`}
                  className="flex flex-col gap-2 rounded-xl border border-ink-700 bg-ink-900 p-4 sm:flex-row sm:items-center sm:gap-4"
                >
                  <blockquote className="flex-1 border-l-2 border-accent-400/70 pl-3 text-sm text-ink-200 italic">
                    “{item.excerpt}”
                  </blockquote>
                  <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                    {item.signalIds.map((signalId) => {
                      const signal = result.signals.find((entry) => entry.id === signalId);
                      if (!signal) return null;
                      const meta = CATEGORY_META[signal.category];
                      return (
                        <span
                          key={signalId}
                          className={`inline-flex items-center gap-1 rounded-md border border-ink-700 bg-ink-850 px-2 py-1 text-[11px] font-medium ${meta.className}`}
                        >
                          <meta.icon className="size-3" aria-hidden="true" />
                          {meta.label}
                        </span>
                      );
                    })}
                    {item.note ? (
                      <span className="text-[11px] text-ink-500">{item.note}</span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="card p-6" aria-labelledby="actions-title">
        <h2 id="actions-title" className="text-lg font-semibold text-ink-100">
          What should I do?
        </h2>
        <ol className="mt-4 flex flex-col gap-3">
          {result.recommended_actions.map((item, index) => {
            const meta = PRIORITY_META[item.priority];
            return (
              <li
                key={`${item.action}-${index}`}
                className={`flex items-start gap-4 rounded-xl border border-ink-700 border-l-4 bg-ink-900 px-4 py-3.5 ${meta.className}`}
              >
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-ink-800 font-mono text-xs font-semibold text-ink-300">
                  {index + 1}
                </span>
                <div>
                  <p className="text-[11px] font-semibold tracking-widest text-ink-500 uppercase">
                    {meta.label}
                  </p>
                  <p className="mt-0.5 text-sm text-ink-200">{item.action}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {result.input_type === "image" && result.extracted_text ? (
        <section className="card p-6" aria-labelledby="extracted-title">
          <h2 id="extracted-title" className="text-lg font-semibold text-ink-100">
            Text extracted from screenshot
          </h2>
          <p className="mt-1 text-xs text-ink-500">
            Shown so you can verify the OCR result before trusting the analysis.
          </p>
          <pre className="scrollbar-slim mt-4 max-h-64 overflow-auto whitespace-pre-wrap rounded-xl border border-ink-700 bg-ink-900 p-4 font-mono text-xs leading-relaxed text-ink-200">
            {result.extracted_text}
          </pre>
        </section>
      ) : null}

      <section className="card flex flex-col gap-2 p-5">
        <div className="flex items-center gap-2 text-sm font-medium text-ink-200">
          <ShieldAlert className="size-4 text-accent-400" aria-hidden="true" />
          Analysis notes
        </div>
        <p className="text-xs leading-relaxed text-ink-400">
          {result.ai_available
            ? "AI contextual analysis was available and contributed to the explanation. The risk score still comes from deterministic signals."
            : "AI provider unavailable — the analysis ran on the deterministic signal engine only. Scores and signals are unaffected; the explanation is rule-generated."}
          {result.confidence_note ? ` ${result.confidence_note}` : ""}
        </p>
        <p className="text-xs leading-relaxed text-ink-500">
          Language detected: {result.language.toUpperCase()} · Created {createdAt.toLocaleString()}
          {result.input_type !== "text" ? null : " · Input kept in memory only"}
        </p>
      </section>
    </div>
  );
}

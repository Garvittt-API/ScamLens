import type { ReactNode } from "react";

type Tone = "neutral" | "accent" | "low" | "medium" | "high" | "critical";

const TONES: Record<Tone, string> = {
  neutral: "border-ink-600 bg-ink-800 text-ink-300",
  accent: "border-accent-400/40 bg-accent-500/10 text-accent-300",
  low: "border-risk-low/40 bg-risk-low/10 text-risk-low",
  medium: "border-risk-medium/40 bg-risk-medium/10 text-risk-medium",
  high: "border-risk-high/40 bg-risk-high/10 text-risk-high",
  critical: "border-risk-critical/40 bg-risk-critical/10 text-risk-critical",
};

export function Badge({
  tone = "neutral",
  children,
  className = "",
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium tracking-wide uppercase ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

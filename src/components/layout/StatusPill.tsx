"use client";

import { useEffect, useState } from "react";
import { getHealth } from "@/lib/api";

type Status = "checking" | "ok" | "degraded" | "offline";

const LABELS: Record<Status, { text: string; dot: string; textClass: string }> = {
  checking: { text: "Checking…", dot: "bg-ink-500 animate-pulse-soft", textClass: "text-ink-500" },
  ok: { text: "AI online", dot: "bg-risk-low", textClass: "text-risk-low" },
  degraded: { text: "Rules only", dot: "bg-risk-medium", textClass: "text-risk-medium" },
  offline: { text: "Backend offline", dot: "bg-risk-critical", textClass: "text-risk-critical" },
};

export function StatusPill() {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    let cancelled = false;
    getHealth()
      .then((health) => {
        if (!cancelled) setStatus(health.status === "ok" ? "ok" : "degraded");
      })
      .catch(() => {
        if (!cancelled) setStatus("offline");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const meta = LABELS[status];

  return (
    <span
      title={
        status === "ok"
          ? "AI context analysis and OCR are available"
          : status === "degraded"
            ? "AI provider unavailable — deterministic signal engine still runs"
            : "Cannot reach the backend"
      }
      className={`hidden items-center gap-1.5 rounded-full border border-ink-700 bg-ink-900 px-2.5 py-1 text-[11px] font-medium sm:inline-flex ${meta.textClass}`}
    >
      <span className={`size-1.5 rounded-full ${meta.dot}`} aria-hidden="true" />
      {meta.text}
    </span>
  );
}

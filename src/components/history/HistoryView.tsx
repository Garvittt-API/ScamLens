"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bookmark,
  Camera,
  Clock,
  Link2,
  MessageSquareText,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { INPUT_LABELS } from "@/lib/api";
import {
  clearHistory,
  getHistoryServerSnapshot,
  getHistorySnapshot,
  removeHistoryEntry,
  subscribeHistory,
} from "@/lib/history";
import { useSyncExternalStore } from "react";
import type { RiskLevel } from "@/lib/types";

const LEVEL_TONE: Record<RiskLevel, "low" | "medium" | "high" | "critical"> = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
};

const INPUT_ICON = {
  text: MessageSquareText,
  image: Camera,
  url: Link2,
} as const;

export function HistoryView() {
  const entries = useSyncExternalStore(subscribeHistory, getHistorySnapshot, getHistoryServerSnapshot);

  return (
    <div className="animate-fade-in flex flex-col gap-5">
      <div className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-accent-400" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-ink-100">Your history stays in this browser</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-400">
              Entries are saved in local storage on this device only — never on a server. Only a
              short summary, the risk level, and signal titles are stored. Raw messages,
              screenshots, and evidence text are never saved. You control what is kept.
            </p>
          </div>
        </div>
        {entries.length > 0 ? (
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              if (window.confirm("Delete all saved history entries from this browser?")) {
                clearHistory();
              }
            }}
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Clear all
          </Button>
        ) : null}
      </div>

      {entries.length === 0 ? (
        <div className="card flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full border border-ink-700 bg-ink-900 text-ink-500">
            <Bookmark className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink-100">No saved analyses yet</p>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-ink-400">
              Nothing is stored automatically. After an analysis, you can choose to save its summary
              here — raw content is never kept.
            </p>
          </div>
          <Link href="/analyze">
            <Button size="md">
              Analyze a message
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {entries.map((entry) => {
            const InputIcon = INPUT_ICON[entry.input_type];
            const createdAt = new Date(entry.created_at);
            return (
              <li key={entry.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={LEVEL_TONE[entry.risk_level]}>{entry.risk_level} risk</Badge>
                    <Badge tone="neutral">
                      <InputIcon className="size-3" aria-hidden="true" />
                      {INPUT_LABELS[entry.input_type]}
                    </Badge>
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] text-ink-500">
                      <Clock className="size-3" aria-hidden="true" />
                      {createdAt.toLocaleDateString()} {createdAt.toLocaleTimeString()}
                    </span>
                    <span className="font-mono text-[11px] text-ink-500">
                      score {entry.risk_score}/100
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeHistoryEntry(entry.id)}
                    aria-label="Delete this entry"
                    className="flex size-8 items-center justify-center rounded-lg border border-ink-700 text-ink-400 transition-colors hover:border-risk-critical/60 hover:text-risk-critical"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </div>

                <p className="mt-3 text-sm text-ink-200">{entry.summary}</p>

                {entry.signal_titles.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {entry.signal_titles.map((title) => (
                      <span
                        key={title}
                        className="rounded-md border border-ink-700 bg-ink-900 px-2 py-0.5 text-[11px] text-ink-400"
                      >
                        {title}
                      </span>
                    ))}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

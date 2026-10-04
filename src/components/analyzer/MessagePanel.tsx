"use client";

import { Eraser, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { EXAMPLE_MESSAGE, TEXT_MAX_LENGTH } from "@/lib/constants";

interface MessagePanelProps {
  value: string;
  onChange: (value: string) => void;
  busy: boolean;
  onSubmit: () => void;
}

export function MessagePanel({ value, onChange, busy, onSubmit }: MessagePanelProps) {
  const remaining = TEXT_MAX_LENGTH - value.length;
  const overLimit = remaining < 0;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="flex flex-col gap-4"
    >
      <div className="flex items-end justify-between gap-4">
        <label htmlFor="message-input" className="text-sm font-medium text-ink-200">
          Paste the suspicious message
        </label>
        <button
          type="button"
          onClick={() => onChange(EXAMPLE_MESSAGE)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-400 transition-colors hover:text-accent-300"
        >
          <Sparkles className="size-3.5" aria-hidden="true" />
          Use example message
        </button>
      </div>

      <textarea
        id="message-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={8}
        spellCheck={false}
        placeholder={
          "Paste an SMS, WhatsApp message, email body, or DM here…\n\nExample: Your bank account will be blocked today. Send your OTP immediately."
        }
        className="scrollbar-slim w-full resize-y rounded-xl border border-ink-700 bg-ink-900 p-4 text-sm leading-relaxed text-ink-100 placeholder:text-ink-500 focus:border-accent-400/60 focus:outline-none"
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span
          className={`font-mono text-xs ${overLimit ? "text-risk-critical" : remaining < 200 ? "text-risk-medium" : "text-ink-500"}`}
        >
          {value.length.toLocaleString()} / {TEXT_MAX_LENGTH.toLocaleString()} characters
        </span>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="md"
            onClick={() => onChange("")}
            disabled={busy || value.length === 0}
          >
            <Eraser className="size-4" aria-hidden="true" />
            Clear
          </Button>
          <Button type="submit" size="md" disabled={busy || value.trim().length === 0 || overLimit}>
            {busy ? <Spinner size="sm" /> : null}
            {busy ? "Analyzing…" : "Analyze message"}
          </Button>
        </div>
      </div>
    </form>
  );
}

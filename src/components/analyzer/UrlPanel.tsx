"use client";

import { Link2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { URL_MAX_LENGTH } from "@/lib/constants";

interface UrlPanelProps {
  value: string;
  onChange: (value: string) => void;
  busy: boolean;
  onSubmit: () => void;
}

export function UrlPanel({ value, onChange, busy, onSubmit }: UrlPanelProps) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="flex flex-col gap-4"
    >
      <label htmlFor="url-input" className="text-sm font-medium text-ink-200">
        Paste the suspicious link
      </label>

      <div className="flex items-center gap-3 rounded-xl border border-ink-700 bg-ink-900 px-4 focus-within:border-accent-400/60">
        <Link2 className="size-4 shrink-0 text-ink-500" aria-hidden="true" />
        <input
          id="url-input"
          type="text"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          maxLength={URL_MAX_LENGTH}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="https://example.com/suspicious-link"
          className="h-12 w-full bg-transparent font-mono text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
        />
      </div>

      <div className="flex items-start gap-2.5 rounded-lg border border-ink-700 bg-ink-900/60 px-4 py-3">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-accent-400" aria-hidden="true" />
        <p className="text-xs leading-relaxed text-ink-400">
          ScamLens never visits, fetches, or executes the link. It performs static inspection only:
          HTTPS use, hostname shape, subdomain depth, URL shorteners, impersonation patterns, and
          suspicious keywords. Internal and private network targets are rejected outright.
        </p>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button type="submit" size="md" disabled={busy || value.trim().length === 0}>
          {busy ? <Spinner size="sm" /> : <Link2 className="size-4" aria-hidden="true" />}
          {busy ? "Inspecting link…" : "Analyze URL"}
        </Button>
      </div>
    </form>
  );
}

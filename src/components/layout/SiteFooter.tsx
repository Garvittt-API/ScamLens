import { Lock } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-ink-800 bg-ink-900/60">
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:px-6 md:grid-cols-3">
        <div>
          <p className="text-sm font-semibold text-ink-200">ScamLens</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-400">
            TC059 — Scam Message Explainer. An explainable AI prototype that shows why a message was
            flagged and what to do next.
          </p>
        </div>

        <div>
          <p className="flex items-center gap-1.5 text-sm font-semibold text-ink-200">
            <Lock className="size-3.5 text-accent-400" aria-hidden="true" />
            Privacy by default
          </p>
          <p className="mt-1 text-xs leading-relaxed text-ink-400">
            Messages are analyzed in memory and not stored. Screenshots are processed temporarily and
            discarded. No accounts, no tracking, no API keys in the browser.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-ink-200">About the Risk Score</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-400">
            The Risk Score is a transparent heuristic built from detected signals. It is not a
            scientifically validated probability. When in doubt, verify through official channels.
          </p>
        </div>
      </div>

      <div className="border-t border-ink-800/70">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-4 text-[11px] text-ink-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>Built for the college hackathon — prototype, not a commercial security product.</span>
          <span>Don&apos;t just wonder if it&apos;s a scam. Know why.</span>
        </div>
      </div>
    </footer>
  );
}

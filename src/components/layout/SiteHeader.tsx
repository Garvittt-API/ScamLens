import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { StatusPill } from "./StatusPill";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink-800 bg-ink-950/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg border border-accent-400/40 bg-accent-500/10 text-accent-300 transition-colors group-hover:bg-accent-500/20">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-base font-semibold tracking-tight text-ink-100">ScamLens</span>
            <span className="text-[10px] font-medium tracking-[0.18em] text-ink-500 uppercase">
              Explainable scam analysis
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <StatusPill />
          <Link
            href="/"
            className="rounded-lg px-3 py-2 text-sm text-ink-300 transition-colors hover:bg-ink-800 hover:text-ink-100"
          >
            Home
          </Link>
          <Link
            href="/history"
            className="rounded-lg px-3 py-2 text-sm text-ink-300 transition-colors hover:bg-ink-800 hover:text-ink-100"
          >
            History
          </Link>
          <Link
            href="/analyze"
            className="rounded-lg bg-accent-500/10 px-3 py-2 text-sm font-medium text-accent-300 transition-colors hover:bg-accent-500/20"
          >
            Analyze
          </Link>
        </nav>
      </div>
    </header>
  );
}

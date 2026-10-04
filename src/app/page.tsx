import Link from "next/link";
import {
  ArrowRight,
  Braces,
  Camera,
  ClipboardCheck,
  Fingerprint,
  KeyRound,
  Link2,
  ListChecks,
  MessageSquareText,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Waypoints,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EXAMPLE_MESSAGE } from "@/lib/constants";

const INPUT_TYPES = [
  {
    icon: MessageSquareText,
    title: "Paste a message",
    description: "Suspicious SMS, WhatsApp, email, or DM text. Get signals, evidence, and next steps.",
    href: "/analyze?tab=text",
  },
  {
    icon: Camera,
    title: "Upload a screenshot",
    description: "PNG, JPG, or WEBP. ScamLens extracts the text first, then analyzes what it found.",
    href: "/analyze?tab=image",
  },
  {
    icon: Link2,
    title: "Check a URL",
    description: "Static, safe inspection of a suspicious link. It is never visited or executed.",
    href: "/analyze?tab=url",
  },
];

const PIPELINE = [
  { icon: ScanSearch, label: "Content extraction", detail: "Text, OCR, or URL parsing" },
  { icon: Fingerprint, label: "Security signals", detail: "Deterministic pattern detection" },
  { icon: Braces, label: "AI context", detail: "Intent and social-engineering tactics" },
  { icon: ShieldCheck, label: "Risk assessment", detail: "Transparent, weighted scoring" },
  { icon: ListChecks, label: "Explanation + actions", detail: "Why it was flagged, what to do" },
];

const TRUST_POINTS = [
  {
    icon: KeyRound,
    title: "No account, no tracking",
    detail: "Open the analyzer and go. Nothing follows you home.",
  },
  {
    icon: ClipboardCheck,
    title: "Nothing stored by default",
    detail: "Messages stay in memory. Screenshots are discarded after analysis.",
  },
  {
    icon: Sparkles,
    title: "Useful even without AI",
    detail: "The deterministic signal engine keeps working if the AI provider is offline.",
  },
];

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
      <section className="pt-16 pb-14 sm:pt-24 sm:pb-20">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent-400/30 bg-accent-500/10 px-3 py-1 text-xs font-medium tracking-wide text-accent-300 uppercase">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            TC059 · Scam Message Explainer
          </span>

          <h1 className="text-balance-tight mt-6 text-4xl font-semibold leading-[1.08] tracking-tight text-ink-100 sm:text-5xl lg:text-6xl">
            Don&apos;t just wonder if it&apos;s a scam.{" "}
            <span className="bg-gradient-to-r from-accent-300 via-accent-400 to-accent-500 bg-clip-text text-transparent">
              Know why.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink-300 sm:text-lg">
            ScamLens analyzes suspicious messages, screenshots, and links — then explains the warning
            signs in plain language, shows the exact evidence it found, and tells you what to do next.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/analyze">
              <Button size="lg" className="w-full sm:w-auto">
                Analyze a message
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            </Link>
            <Link href={`/analyze?tab=text&example=1&text=${encodeURIComponent(EXAMPLE_MESSAGE)}`}>
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                Try the example scam
              </Button>
            </Link>
          </div>

          <p className="mt-4 text-xs text-ink-500">
            No sign-up. Inputs are analyzed in memory and not saved.
          </p>
        </div>
      </section>

      <section className="border-t border-ink-800 py-14">
        <div className="flex items-end justify-between gap-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-ink-100">Three ways to check</h2>
            <p className="mt-2 max-w-xl text-sm text-ink-400">
              Every input type runs through the same pipeline and produces the same structured result.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {INPUT_TYPES.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="card group p-6 transition-all duration-200 hover:border-accent-400/50 hover:shadow-glow"
            >
              <span className="flex size-10 items-center justify-center rounded-lg border border-ink-600 bg-ink-800 text-accent-300 transition-colors group-hover:border-accent-400/50 group-hover:bg-accent-500/10">
                <item.icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-base font-semibold text-ink-100">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-400">{item.description}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-accent-400 opacity-0 transition-opacity group-hover:opacity-100">
                Open analyzer <ArrowRight className="size-3" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-ink-800 py-14">
        <h2 className="text-2xl font-semibold tracking-tight text-ink-100">
          Not a black box — here is the pipeline
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-ink-400">
          ScamLens does not ask an LLM &quot;is this a scam?&quot; Deterministic security signals are
          detected first, the AI only adds context, and the final score comes from a transparent,
          configurable weighting.
        </p>

        <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {PIPELINE.map((step, index) => (
            <li key={step.label} className="card relative p-5">
              <span className="absolute top-4 right-4 font-mono text-xs text-ink-600">
                {String(index + 1).padStart(2, "0")}
              </span>
              <step.icon className="size-5 text-accent-400" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold text-ink-100">{step.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-400">{step.detail}</p>
            </li>
          ))}
        </ol>

        <div className="mt-6 flex items-center gap-2 text-xs text-ink-500">
          <Waypoints className="size-4 text-accent-400" aria-hidden="true" />
          Text, screenshot, and URL all converge on one normalized result format, rendered by a single
          results dashboard.
        </div>
      </section>

      <section className="border-t border-ink-800 py-14">
        <div className="grid gap-8 md:grid-cols-3">
          {TRUST_POINTS.map((item) => (
            <div key={item.title} className="flex gap-4">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-ink-700 bg-ink-850 text-accent-400">
                <item.icon className="size-4" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-ink-100">{item.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-400">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="card mt-10 flex flex-col items-start justify-between gap-6 p-8 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-semibold text-ink-100">Have a message you are unsure about?</h2>
            <p className="mt-1.5 text-sm text-ink-400">
              Paste it, drop a screenshot, or check a link. You will get an answer you can act on.
            </p>
          </div>
          <Link href="/analyze" className="shrink-0">
            <Button size="lg">
              Open the analyzer
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

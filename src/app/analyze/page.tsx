import type { Metadata } from "next";
import { Analyzer } from "@/components/analyzer/Analyzer";
import { TEXT_MAX_LENGTH } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Analyze",
  description:
    "Paste a message, upload a screenshot, or check a URL. ScamLens explains the warning signs and tells you what to do next.",
};

type Tab = "text" | "image" | "url";

export default async function AnalyzePage({ searchParams }: PageProps<"/analyze">) {
  const params = await searchParams;

  const rawTab = typeof params.tab === "string" ? params.tab : "";
  const initialTab: Tab = rawTab === "image" || rawTab === "url" ? rawTab : "text";

  const rawText = typeof params.text === "string" ? params.text : "";
  const initialText = rawText ? rawText.slice(0, TEXT_MAX_LENGTH) : "";

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-100 sm:text-3xl">
          Analyze a suspicious message
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-400">
          Choose an input type. Every analysis follows the same pipeline: extraction → security
          signals → risk scoring → AI context → explanation → recommended actions.
        </p>
      </header>

      <Analyzer initialTab={initialTab} initialText={initialText} />
    </div>
  );
}

import type { Metadata } from "next";
import { HistoryView } from "@/components/history/HistoryView";

export const metadata: Metadata = {
  title: "History",
  description: "Locally saved analysis summaries — stored only in your browser.",
};

export default function HistoryPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-100 sm:text-3xl">
          Analysis history
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-400">
          Opt-in summaries of analyses you chose to save. Everything here lives in your
          browser&apos;s local storage on this device only.
        </p>
      </header>

      <HistoryView />
    </div>
  );
}

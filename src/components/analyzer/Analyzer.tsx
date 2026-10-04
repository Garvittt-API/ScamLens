"use client";

import { useCallback, useState } from "react";
import { AlertTriangle, Camera, Link2, MessageSquareText, RefreshCw } from "lucide-react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { MessagePanel } from "@/components/analyzer/MessagePanel";
import { ScreenshotPanel } from "@/components/analyzer/ScreenshotPanel";
import { UrlPanel } from "@/components/analyzer/UrlPanel";
import { ResultDashboard } from "@/components/result/ResultDashboard";
import { analyzeImage, analyzeText, analyzeUrl, ApiError } from "@/lib/api";
import { TEXT_MAX_LENGTH, TEXT_MIN_LENGTH, URL_MAX_LENGTH } from "@/lib/constants";
import type { AnalysisResult } from "@/lib/types";

type Tab = "text" | "image" | "url";

const TABS: { value: Tab; label: string; icon: React.ReactNode }[] = [
  { value: "text", label: "Message", icon: <MessageSquareText className="size-4" aria-hidden="true" /> },
  { value: "image", label: "Screenshot", icon: <Camera className="size-4" aria-hidden="true" /> },
  { value: "url", label: "URL", icon: <Link2 className="size-4" aria-hidden="true" /> },
];

const TAB_HINTS: Record<Tab, string> = {
  text: "Paste the message you received. ScamLens detects security signals first, then adds AI context.",
  image: "Upload a screenshot. Text is extracted on-device-style via OCR before any analysis runs.",
  url: "Static link inspection only — the URL is never opened, visited, or executed.",
};

function isValidUrl(value: string): boolean {
  try {
    const parsed = new URL(value.trim());
    return (parsed.protocol === "http:" || parsed.protocol === "https:") && parsed.hostname.includes(".");
  } catch {
    return false;
  }
}

interface AnalyzerProps {
  initialTab?: Tab;
  initialText?: string;
}

export function Analyzer({ initialTab = "text", initialText = "" }: AnalyzerProps) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [text, setText] = useState(() => initialText.slice(0, TEXT_MAX_LENGTH));
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");

  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setStatus("idle");
  }, []);

  const run = useCallback(async () => {
    setError(null);

    try {
      if (tab === "text") {
        const trimmed = text.trim();
        if (!trimmed) throw new ApiError("Paste a message before analyzing.", "empty_input");
        if (trimmed.length < TEXT_MIN_LENGTH) {
          throw new ApiError("That message is too short to analyze meaningfully.", "too_short");
        }
        if (trimmed.length > TEXT_MAX_LENGTH) {
          throw new ApiError(
            `Message is too long. Limit is ${TEXT_MAX_LENGTH} characters.`,
            "too_long",
          );
        }
      }

      if (tab === "url") {
        const trimmed = url.trim();
        if (!trimmed) throw new ApiError("Enter a URL before analyzing.", "empty_input");
        if (trimmed.length > URL_MAX_LENGTH) {
          throw new ApiError("That URL is too long to inspect.", "too_long");
        }
        if (!isValidUrl(trimmed)) {
          throw new ApiError(
            "Enter a valid URL starting with http:// or https://",
            "invalid_url",
          );
        }
      }

      if (tab === "image" && !file) {
        throw new ApiError("Choose a screenshot before analyzing.", "empty_input");
      }

      setStatus("loading");
      setResult(null);

      const analysis =
        tab === "text"
          ? await analyzeText(text)
          : tab === "image"
            ? await analyzeImage(file as File)
            : await analyzeUrl(url);

      setResult(analysis);
      setStatus("done");
    } catch (caught) {
      setStatus("idle");
      if (caught instanceof ApiError) {
        setError(caught.message);
      } else {
        setError("Something went wrong while analyzing. Please try again.");
      }
    }
  }, [tab, text, file, url]);

  if (result) {
    return (
      <div className="animate-fade-in flex flex-col gap-6">
        <ResultDashboard result={result} onAnalyzeAnother={reset} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <SegmentedControl
          ariaLabel="Analysis input type"
          options={TABS}
          value={tab}
          onChange={(next) => {
            reset();
            setTab(next);
          }}
        />
        <p className="text-sm text-ink-400">{TAB_HINTS[tab]}</p>
      </div>

      <div className="card p-5 sm:p-6">
        {tab === "text" ? (
          <MessagePanel value={text} onChange={setText} busy={status === "loading"} onSubmit={run} />
        ) : tab === "image" ? (
          <ScreenshotPanel file={file} onFileChange={setFile} busy={status === "loading"} onSubmit={run} />
        ) : (
          <UrlPanel value={url} onChange={setUrl} busy={status === "loading"} onSubmit={run} />
        )}
      </div>

      {error ? (
        <div
          role="alert"
          className="animate-fade-in flex items-start gap-3 rounded-xl border border-risk-critical/40 bg-risk-critical/10 px-4 py-3.5"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-risk-critical" aria-hidden="true" />
          <p className="text-sm text-risk-critical">{error}</p>
        </div>
      ) : null}

      {status === "loading" ? (
        <div className="card animate-fade-in flex items-center gap-4 p-5">
          <RefreshCw className="size-5 animate-spin text-accent-400" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-ink-100">
              {tab === "image" ? "Extracting text from screenshot…" : "Analyzing…"}
            </p>
            <p className="mt-0.5 text-xs text-ink-400">
              {tab === "image"
                ? "First screenshot of a session can take a few extra seconds while the OCR engine warms up."
                : "Running security signals, risk scoring, and AI context analysis."}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

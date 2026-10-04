"use client";

import { useRef, useState } from "react";
import { ImageUp, ScanSearch, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { IMAGE_MAX_BYTES, IMAGE_TYPES } from "@/lib/constants";

interface ScreenshotPanelProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  busy: boolean;
  onSubmit: () => void;
}

const ACCEPT = IMAGE_TYPES.join(",");

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ScreenshotPanel({ file, onFileChange, busy, onSubmit }: ScreenshotPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  function setPreview(candidate: File | null) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = candidate ? URL.createObjectURL(candidate) : null;
    setPreviewUrl(previewRef.current);
  }

  function clearSelection() {
    setPreview(null);
    setLocalError(null);
    onFileChange(null);
  }

  function validate(candidate: File): string | null {
    if (!IMAGE_TYPES.includes(candidate.type as (typeof IMAGE_TYPES)[number])) {
      return "Unsupported file type. Use a PNG, JPG, JPEG, or WEBP image.";
    }
    if (candidate.size > IMAGE_MAX_BYTES) {
      return `Image is too large (${formatBytes(candidate.size)}). Maximum size is ${formatBytes(IMAGE_MAX_BYTES)}.`;
    }
    if (candidate.size === 0) {
      return "That file appears to be empty. Choose a different screenshot.";
    }
    return null;
  }

  function accept(candidate: File) {
    const error = validate(candidate);
    if (error) {
      setLocalError(error);
      setPreview(null);
      onFileChange(null);
      return;
    }
    setLocalError(null);
    setPreview(candidate);
    onFileChange(candidate);
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="flex flex-col gap-4"
    >
      <label className="text-sm font-medium text-ink-200">Upload a screenshot of the message</label>

      {!file ? (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            const dropped = event.dataTransfer.files?.[0];
            if (dropped) accept(dropped);
          }}
          className={`flex min-h-56 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
            dragging
              ? "border-accent-400 bg-accent-500/10"
              : "border-ink-600 bg-ink-900 hover:border-ink-500 hover:bg-ink-850"
          }`}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
          }}
        >
          <span className="flex size-12 items-center justify-center rounded-full border border-ink-600 bg-ink-800 text-accent-300">
            <ImageUp className="size-6" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-medium text-ink-100">Drag and drop, or click to browse</p>
            <p className="mt-1 text-xs text-ink-400">
              PNG, JPG, JPEG, WEBP · up to {formatBytes(IMAGE_MAX_BYTES)}
            </p>
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="relative flex max-h-72 items-center justify-center bg-ink-950 p-2">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Screenshot preview"
                className="max-h-68 w-auto max-w-full rounded-md object-contain"
              />
            ) : null}
            <button
              type="button"
              onClick={clearSelection}
              aria-label="Remove screenshot"
              className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-full border border-ink-600 bg-ink-900/90 text-ink-300 transition-colors hover:border-risk-critical/60 hover:text-risk-critical"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ink-700 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-ink-200">{file.name}</p>
              <p className="text-[11px] text-ink-500">
                {file.type} · {formatBytes(file.size)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-xs font-medium text-accent-400 hover:text-accent-300"
            >
              Choose another
            </button>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(event) => {
          const picked = event.target.files?.[0];
          if (picked) accept(picked);
          event.target.value = "";
        }}
      />

      {localError ? (
        <p className="rounded-lg border border-risk-critical/40 bg-risk-critical/10 px-4 py-3 text-sm text-risk-critical">
          {localError}
        </p>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        <Button type="submit" size="md" disabled={busy || !file}>
          {busy ? <Spinner size="sm" /> : <ScanSearch className="size-4" aria-hidden="true" />}
          {busy ? "Extracting text…" : "Analyze screenshot"}
        </Button>
      </div>
    </form>
  );
}

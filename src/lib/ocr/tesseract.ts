import type { Worker } from "tesseract.js";

const OCR_TIMEOUT_MS = 90_000;
const MIN_MEANINGFUL_CHARS = 4;

export type OcrOutcome =
  | { ok: true; text: string }
  | { ok: false; error: "unavailable" | "timeout" | "failed" | "no_text" };

let workerPromise: Promise<Worker> | null = null;

async function createOcrWorker(): Promise<Worker> {
  const { createWorker } = await import("tesseract.js");
  return createWorker("eng");
}

function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = createOcrWorker();
    workerPromise.catch(() => {
      workerPromise = null;
    });
  }
  return workerPromise;
}

class TimeoutError extends Error {}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError("ocr_timeout")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/**
 * Extracts text from an image buffer using local OCR (tesseract.js).
 * The worker is cached per server instance; language data downloads on first use.
 */
export async function extractTextFromImage(buffer: Buffer): Promise<OcrOutcome> {
  let worker: Worker;
  try {
    worker = await getWorker();
  } catch {
    return { ok: false, error: "unavailable" };
  }

  try {
    const result = await withTimeout(worker.recognize(buffer), OCR_TIMEOUT_MS);
    const text = (result.data.text ?? "").replace(/\r/g, "").trim();
    if (text.replace(/\s+/g, "").length < MIN_MEANINGFUL_CHARS) {
      return { ok: false, error: "no_text" };
    }
    return { ok: true, text };
  } catch (caught) {
    if (caught instanceof TimeoutError) return { ok: false, error: "timeout" };
    return { ok: false, error: "failed" };
  }
}

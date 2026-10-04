// Pre-downloads OCR language data so the first screenshot analysis is fast during demos.
// Usage: npm run warmup:ocr
import { createWorker } from "tesseract.js";

const started = Date.now();
console.log("[warmup] downloading English OCR data (first run only)...");

const worker = await createWorker("eng");
await worker.terminate();

console.log(`[warmup] OCR ready in ${((Date.now() - started) / 1000).toFixed(1)}s`);

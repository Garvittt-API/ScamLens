import { getAIProvider } from "@/lib/ai/provider";
import { json } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let ocrCheck: Promise<boolean> | null = null;

function checkOcrAvailable(): Promise<boolean> {
  if (!ocrCheck) {
    ocrCheck = import("tesseract.js")
      .then(() => true)
      .catch(() => false);
  }
  return ocrCheck;
}

export async function GET(): Promise<Response> {
  const ai = getAIProvider().isAvailable();
  const ocr = await checkOcrAvailable();

  return json({
    status: ai && ocr ? "ok" : "degraded",
    ai,
    ocr,
    version: "0.1.0",
  });
}

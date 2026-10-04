import { enforceRateLimit } from "@/lib/server/rateLimit";
import { handleRoute, json, RequestError } from "@/lib/server/http";
import { validateImageFile } from "@/lib/server/validation";
import { runAnalysis } from "@/lib/pipeline/analyze";
import { extractTextFromImage } from "@/lib/ocr/tesseract";
import { TEXT_MAX_LENGTH } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OCR_ERRORS: Record<string, { status: number; message: string }> = {
  unavailable: {
    status: 503,
    message:
      "Screenshot text extraction is unavailable right now. You can paste the message text instead.",
  },
  timeout: {
    status: 504,
    message: "Screenshot processing took too long. Try a smaller or clearer image.",
  },
  no_text: {
    status: 422,
    message:
      "We couldn't read any text in that screenshot. Try a sharper image, or paste the message text instead.",
  },
  failed: {
    status: 422,
    message: "We couldn't process that screenshot. Try a different image or paste the text instead.",
  },
};

export async function POST(req: Request): Promise<Response> {
  return handleRoute(async () => {
    enforceRateLimit(req);

    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      throw new RequestError("Invalid upload.", "bad_request", 400);
    }

    const entry = form.get("image");
    const file = entry instanceof File ? entry : null;
    const image = validateImageFile(file);

    const buffer = Buffer.from(await image.arrayBuffer());
    const ocr = await extractTextFromImage(buffer);

    if (!ocr.ok) {
      const mapped = OCR_ERRORS[ocr.error] ?? OCR_ERRORS.failed;
      throw new RequestError(mapped.message, `ocr_${ocr.error}`, mapped.status);
    }

    const text = ocr.text.length > TEXT_MAX_LENGTH ? ocr.text.slice(0, TEXT_MAX_LENGTH) : ocr.text;

    const result = await runAnalysis({ inputType: "image", content: text, displayText: text });
    return json(result);
  });
}

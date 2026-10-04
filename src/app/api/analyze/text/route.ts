import { runAnalysis } from "@/lib/pipeline/analyze";
import { enforceRateLimit } from "@/lib/server/rateLimit";
import { handleRoute, json, readJson } from "@/lib/server/http";
import { validateTextInput } from "@/lib/server/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  return handleRoute(async () => {
    enforceRateLimit(req);
    const body = await readJson(req);
    const text = validateTextInput(body.text);

    const result = await runAnalysis({ inputType: "text", content: text });
    return json(result);
  });
}

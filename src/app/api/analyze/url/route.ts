import { runAnalysis } from "@/lib/pipeline/analyze";
import { enforceRateLimit } from "@/lib/server/rateLimit";
import { handleRoute, json, readJson } from "@/lib/server/http";
import { validateUrlInput } from "@/lib/server/validation";
import { analyzeUrlStructure } from "@/lib/url/analyze";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  return handleRoute(async () => {
    enforceRateLimit(req);
    const body = await readJson(req);
    const url = validateUrlInput(body.url);

    const parsed = new URL(url);
    const findings = analyzeUrlStructure(parsed);

    const result = await runAnalysis({
      inputType: "url",
      content: url,
      extraSignals: findings,
    });

    return json(result);
  });
}

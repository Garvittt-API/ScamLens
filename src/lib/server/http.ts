export class RequestError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = "RequestError";
    this.code = code;
    this.status = status;
  }
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export function errorBody(error: string, code: string, status: number): Response {
  return json({ error, code }, status);
}

/**
 * Wraps a route handler so users never see a stack trace and
 * logs never contain user content — only the error code.
 */
export async function handleRoute(handler: () => Promise<Response>): Promise<Response> {
  try {
    return await handler();
  } catch (caught) {
    if (caught instanceof RequestError) {
      return errorBody(caught.message, caught.code, caught.status);
    }
    const message = caught instanceof Error ? caught.message : "unknown";
    console.error(`[scamlens] route error: ${message.slice(0, 200)}`);
    return errorBody(
      "Something went wrong while analyzing. Please try again.",
      "internal_error",
      500,
    );
  }
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      throw new RequestError("Invalid request body.", "bad_request", 400);
    }
    return body as Record<string, unknown>;
  } catch (caught) {
    if (caught instanceof RequestError) throw caught;
    throw new RequestError("Invalid JSON in request body.", "bad_json", 400);
  }
}

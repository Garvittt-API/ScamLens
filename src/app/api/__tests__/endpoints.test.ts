import { describe, expect, it } from "vitest";
import { GET as healthGET } from "@/app/api/health/route";
import { POST as textPOST } from "@/app/api/analyze/text/route";
import { POST as urlPOST } from "@/app/api/analyze/url/route";
import { POST as imagePOST } from "@/app/api/analyze/image/route";
import { DEMO_MESSAGE } from "@/lib/testdata/dataset";

function jsonRequest(path: string, body: unknown): Request {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("GET /api/health", () => {
  it("reports capability status", async () => {
    const response = await healthGET();
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(["ok", "degraded"]).toContain(body.status);
    expect(typeof body.ai).toBe("boolean");
    expect(typeof body.ocr).toBe("boolean");
    expect(typeof body.version).toBe("string");
  });
});

describe("POST /api/analyze/text", () => {
  it("analyzes a message end-to-end", async () => {
    const response = await textPOST(jsonRequest("/api/analyze/text", { text: DEMO_MESSAGE }));
    expect(response.status).toBe(200);

    const result = await response.json();
    expect(result.input_type).toBe("text");
    expect(result.risk_level).toBe("HIGH");
    expect(result.risk_score).toBe(55);
    expect(result.signals.length).toBeGreaterThan(0);
    expect(result.recommended_actions.length).toBeGreaterThan(0);
    expect(result.explanation.length).toBeGreaterThan(0);
  });

  it("returns 400 for empty input", async () => {
    const response = await textPOST(jsonRequest("/api/analyze/text", { text: "   " }));
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.code).toBe("empty_input");
    expect(typeof body.error).toBe("string");
  });

  it("returns 400 for malformed JSON", async () => {
    const response = await textPOST(jsonRequest("/api/analyze/text", "{broken"));
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.code).toBe("bad_json");
  });

  it("never leaks a stack trace", async () => {
    const response = await textPOST(jsonRequest("/api/analyze/text", { text: "" }));
    const body = await response.json();
    expect(JSON.stringify(body)).not.toMatch(/stack|\.ts:|at\s+\w+\./i);
  });
});

describe("POST /api/analyze/url", () => {
  it("analyzes a suspicious URL", async () => {
    const response = await urlPOST(
      jsonRequest("/api/analyze/url", { url: "http://sbi-kyc-verify.top/login" }),
    );
    expect(response.status).toBe(200);

    const result = await response.json();
    expect(result.input_type).toBe("url");
    expect(result.signals.some((signal: { id: string }) => signal.id.startsWith("url_"))).toBe(true);
    expect(result.risk_level).not.toBe("LOW");
  });

  it("returns 400 for an invalid URL", async () => {
    const response = await urlPOST(jsonRequest("/api/analyze/url", { url: "nope" }));
    expect(response.status).toBe(400);
    expect((await response.json()).code).toBe("invalid_url");
  });

  it("returns 400 for internal hosts (SSRF)", async () => {
    const response = await urlPOST(
      jsonRequest("/api/analyze/url", { url: "http://192.168.0.10/router" }),
    );
    expect(response.status).toBe(400);
    expect((await response.json()).code).toBe("blocked_host");
  });

  it("returns 400 for javascript: URLs", async () => {
    const response = await urlPOST(jsonRequest("/api/analyze/url", { url: "javascript:x" }));
    expect(response.status).toBe(400);
    expect((await response.json()).code).toBe("unsupported_protocol");
  });
});

describe("POST /api/analyze/image", () => {
  it("returns 400 when the request is not a multipart upload", async () => {
    const request = new Request("http://localhost/api/analyze/image", {
      method: "POST",
      body: "not multipart",
    });
    const response = await imagePOST(request);
    expect(response.status).toBe(400);
    expect((await response.json()).code).toBe("bad_request");
  });

  it("returns 415 for an unsupported file type", async () => {
    const form = new FormData();
    form.append("image", new File([new Uint8Array([1, 2, 3])], "evil.txt", { type: "text/plain" }));

    const response = await imagePOST(
      new Request("http://localhost/api/analyze/image", { method: "POST", body: form }),
    );
    expect(response.status).toBe(415);
    expect((await response.json()).code).toBe("unsupported_image");
  });

  it("returns 400 when no file is provided", async () => {
    const form = new FormData();
    form.append("other", "value");

    const response = await imagePOST(
      new Request("http://localhost/api/analyze/image", { method: "POST", body: form }),
    );
    expect(response.status).toBe(400);
    expect((await response.json()).code).toBe("missing_image");
  });
});

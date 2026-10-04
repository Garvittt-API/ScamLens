import { describe, expect, it } from "vitest";
import { RequestError } from "@/lib/server/http";
import { validateImageFile, validateTextInput, validateUrlInput } from "@/lib/server/validation";
import { TEXT_MAX_LENGTH } from "@/lib/constants";

function expectRequestError(fn: () => unknown, code: string): RequestError {
  try {
    fn();
  } catch (caught) {
    expect(caught).toBeInstanceOf(RequestError);
    const error = caught as RequestError;
    expect(error.code).toBe(code);
    return error;
  }
  throw new Error(`expected RequestError with code ${code}`);
}

describe("validateTextInput", () => {
  it("accepts a normal message and trims it", () => {
    expect(validateTextInput("  hello there  ")).toBe("hello there");
  });

  it("rejects empty and whitespace-only input", () => {
    expectRequestError(() => validateTextInput(""), "empty_input");
    expectRequestError(() => validateTextInput("   \n "), "empty_input");
    expectRequestError(() => validateTextInput(undefined), "empty_input");
    expectRequestError(() => validateTextInput(12345), "empty_input");
  });

  it("rejects messages shorter than the minimum", () => {
    expectRequestError(() => validateTextInput("hi"), "too_short");
  });

  it("rejects messages beyond the maximum length", () => {
    expectRequestError(() => validateTextInput("a".repeat(TEXT_MAX_LENGTH + 1)), "too_long");
  });

  it("uses HTTP 400 for validation failures", () => {
    const error = expectRequestError(() => validateTextInput(""), "empty_input");
    expect(error.status).toBe(400);
  });
});

describe("validateUrlInput", () => {
  it("accepts and normalizes a public URL", () => {
    expect(validateUrlInput("https://example.com/a")).toBe("https://example.com/a");
  });

  it("rejects empty and malformed URLs", () => {
    expectRequestError(() => validateUrlInput(""), "empty_input");
    expectRequestError(() => validateUrlInput("not-a-url"), "invalid_url");
  });

  it("rejects internal targets (SSRF)", () => {
    const error = expectRequestError(
      () => validateUrlInput("http://169.254.169.254/latest/meta-data"),
      "blocked_host",
    );
    expect(error.message).toMatch(/internal|private/i);
  });

  it("rejects non-http protocols", () => {
    expectRequestError(() => validateUrlInput("javascript:alert(1)"), "unsupported_protocol");
  });
});

describe("validateImageFile", () => {
  it("accepts a PNG file within the size limit", () => {
    const file = new File([new Uint8Array([137, 80, 78, 71])], "shot.png", { type: "image/png" });
    expect(validateImageFile(file).name).toBe("shot.png");
  });

  it("rejects a missing file", () => {
    expectRequestError(() => validateImageFile(null), "missing_image");
  });

  it("rejects unsupported types", () => {
    const file = new File([new Uint8Array([1, 2, 3])], "notes.txt", { type: "text/plain" });
    const error = expectRequestError(() => validateImageFile(file), "unsupported_image");
    expect(error.status).toBe(415);
  });

  it("rejects empty files", () => {
    const file = new File([], "empty.png", { type: "image/png" });
    expectRequestError(() => validateImageFile(file), "empty_image");
  });

  it("rejects oversized files", () => {
    const file = new File([new Uint8Array(10)], "big.png", { type: "image/png" });
    Object.defineProperty(file, "size", { value: 6 * 1024 * 1024 });
    const error = expectRequestError(() => validateImageFile(file), "image_too_large");
    expect(error.status).toBe(413);
  });
});

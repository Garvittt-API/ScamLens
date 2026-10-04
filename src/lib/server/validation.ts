import { RequestError } from "./http";
import {
  IMAGE_MAX_BYTES,
  IMAGE_TYPES,
  TEXT_MAX_LENGTH,
  TEXT_MIN_LENGTH,
} from "@/lib/constants";
import { checkUrlSafety } from "@/lib/url/safety";

export function validateTextInput(raw: unknown): string {
  if (typeof raw !== "string" || !raw.trim()) {
    throw new RequestError("Paste a message before analyzing.", "empty_input", 400);
  }
  const text = raw.trim();
  if (text.length < TEXT_MIN_LENGTH) {
    throw new RequestError("That message is too short to analyze meaningfully.", "too_short", 400);
  }
  if (text.length > TEXT_MAX_LENGTH) {
    throw new RequestError(
      `Message is too long. Limit is ${TEXT_MAX_LENGTH} characters.`,
      "too_long",
      400,
    );
  }
  return text;
}

export function validateImageFile(file: File | null | undefined): File {
  if (!file) {
    throw new RequestError("Choose a screenshot before analyzing.", "missing_image", 400);
  }
  if (!(file instanceof File)) {
    throw new RequestError("Invalid image upload.", "unsupported_image", 400);
  }
  if (file.size === 0) {
    throw new RequestError("That file appears to be empty.", "empty_image", 400);
  }
  if (file.size > IMAGE_MAX_BYTES) {
    throw new RequestError(
      "Image is too large. Maximum size is 5 MB.",
      "image_too_large",
      413,
    );
  }
  if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) {
    throw new RequestError(
      "Unsupported file type. Use a PNG, JPG, JPEG, or WEBP image.",
      "unsupported_image",
      415,
    );
  }
  return file;
}

const URL_REJECTION_MESSAGES: Record<string, string> = {
  invalid_url: "Enter a valid URL starting with http:// or https://",
  unsupported_protocol: "Only http:// and https:// URLs can be inspected.",
  credentials_in_url: "URLs containing embedded credentials (user:pass@) are not allowed.",
  blocked_host:
    "ScamLens does not inspect internal, local, or private-network addresses.",
  too_long: "That URL is too long to inspect.",
};

export function validateUrlInput(raw: unknown): string {
  if (typeof raw !== "string" || !raw.trim()) {
    throw new RequestError("Enter a URL before analyzing.", "empty_input", 400);
  }

  const safety = checkUrlSafety(raw);
  if (!safety.ok || !safety.url) {
    const code = safety.reason ?? "invalid_url";
    throw new RequestError(
      URL_REJECTION_MESSAGES[code] ?? URL_REJECTION_MESSAGES.invalid_url,
      code,
      400,
    );
  }

  return safety.url.toString();
}

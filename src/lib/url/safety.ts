export type UrlRejection =
  | "invalid_url"
  | "unsupported_protocol"
  | "credentials_in_url"
  | "blocked_host"
  | "too_long";

export interface UrlSafetyResult {
  ok: boolean;
  url: URL | null;
  reason?: UrlRejection;
}

const MAX_URL_LENGTH = 2048;

function parseIpv4(hostname: string): number[] | null {
  const parts = hostname.split(".");
  if (parts.length !== 4) return null;
  const octets: number[] = [];
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const value = Number(part);
    if (value > 255) return null;
    octets.push(value);
  }
  return octets;
}

function isPrivateIpv4(octets: number[]): boolean {
  const [a, b] = octets;
  if (a === 0) return true;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 192 && b === 0) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a === 198 && (b === 18 || b === 19)) return true;
  if (a >= 224) return true;
  return false;
}

function isPrivateIpv6(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (normalized === "::" || normalized === "::1") return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
  if (/^fe[89ab]/.test(normalized)) return true;
  if (normalized.startsWith("::ffff:")) {
    const mapped = parseIpv4(normalized.slice(7));
    if (mapped) return isPrivateIpv4(mapped);
    return true;
  }
  return false;
}

export function isBlockedHostname(rawHostname: string): boolean {
  const hostname = rawHostname.toLowerCase().replace(/\.$/, "");
  if (!hostname) return true;

  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".home") ||
    hostname.endsWith(".lan")
  ) {
    return true;
  }

  if (hostname.includes(":")) return isPrivateIpv6(hostname);

  const octets = parseIpv4(hostname);
  if (octets) return isPrivateIpv4(octets);

  if (!hostname.includes(".")) return true;

  return false;
}

/**
 * Parses and vetoes a URL WITHOUT performing any network request.
 * Used to guarantee the backend never reaches internal or private resources (SSRF guard).
 */
export function checkUrlSafety(raw: string): UrlSafetyResult {
  const value = raw.trim();
  if (!value || value.length > MAX_URL_LENGTH) {
    return { ok: false, url: null, reason: value.length > MAX_URL_LENGTH ? "too_long" : "invalid_url" };
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return { ok: false, url: null, reason: "invalid_url" };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, url: null, reason: "unsupported_protocol" };
  }

  if (parsed.username || parsed.password) {
    return { ok: false, url: null, reason: "credentials_in_url" };
  }

  if (isBlockedHostname(parsed.hostname)) {
    return { ok: false, url: null, reason: "blocked_host" };
  }

  return { ok: true, url: parsed };
}

import { describe, expect, it } from "vitest";
import { checkUrlSafety, isBlockedHostname } from "@/lib/url/safety";
import { analyzeUrlStructure } from "@/lib/url/analyze";

function ids(url: string): string[] {
  return analyzeUrlStructure(new URL(url)).map((signal) => signal.id);
}

describe("checkUrlSafety (SSRF guard)", () => {
  it("accepts normal public https and http URLs", () => {
    expect(checkUrlSafety("https://example.com/path").ok).toBe(true);
    expect(checkUrlSafety("http://example.org").ok).toBe(true);
  });

  it("rejects non-http protocols", () => {
    expect(checkUrlSafety("javascript:alert(1)").reason).toBe("unsupported_protocol");
    expect(checkUrlSafety("ftp://example.com").reason).toBe("unsupported_protocol");
    expect(checkUrlSafety("file:///etc/passwd").reason).toBe("unsupported_protocol");
  });

  it("rejects loopback, private, and metadata hosts", () => {
    expect(checkUrlSafety("http://localhost:3000").reason).toBe("blocked_host");
    expect(checkUrlSafety("http://127.0.0.1/admin").reason).toBe("blocked_host");
    expect(checkUrlSafety("http://10.0.0.5").reason).toBe("blocked_host");
    expect(checkUrlSafety("http://192.168.1.1").reason).toBe("blocked_host");
    expect(checkUrlSafety("http://172.16.0.1").reason).toBe("blocked_host");
    expect(checkUrlSafety("http://169.254.169.254/latest/meta-data").reason).toBe("blocked_host");
    expect(checkUrlSafety("http://[::1]/").reason).toBe("blocked_host");
    expect(checkUrlSafety("http://[fc00::1]/").reason).toBe("blocked_host");
    expect(checkUrlSafety("http://intranet/").reason).toBe("blocked_host");
    expect(checkUrlSafety("http://printer.local/").reason).toBe("blocked_host");
  });

  it("blocks WHATWG-normalized short IP forms", () => {
    expect(checkUrlSafety("http://127.1/").reason).toBe("blocked_host");
    expect(checkUrlSafety("http://0x7f000001/").reason).toBe("blocked_host");
  });

  it("rejects embedded credentials, garbage, and oversized URLs", () => {
    expect(checkUrlSafety("https://user:pass@example.com").reason).toBe("credentials_in_url");
    expect(checkUrlSafety("not a url").reason).toBe("invalid_url");
    expect(checkUrlSafety("").reason).toBe("invalid_url");
    expect(checkUrlSafety(`https://example.com/${"a".repeat(3000)}`).reason).toBe("too_long");
  });

  it("isBlockedHostname covers common local suffixes", () => {
    expect(isBlockedHostname("localhost")).toBe(true);
    expect(isBlockedHostname("service.internal")).toBe(true);
    expect(isBlockedHostname("example.com")).toBe(false);
  });
});

describe("analyzeUrlStructure", () => {
  it("finds nothing wrong with a plain public https URL", () => {
    expect(ids("https://www.example.com/products")).toEqual([]);
  });

  it("flags plain HTTP", () => {
    expect(ids("http://example.com")).toContain("url_no_https");
  });

  it("flags URL shorteners", () => {
    expect(ids("https://bit.ly/3abc")).toContain("url_shortener");
  });

  it("flags raw IP hosts", () => {
    expect(ids("http://203.0.113.9/login")).toContain("url_ip_host");
  });

  it("flags suspicious wording such as otp and login", () => {
    const found = ids("https://example.com/account/login/verify-otp");
    expect(found).toContain("url_suspicious_keywords");
  });

  it("flags brand names used outside their official domains", () => {
    const signals = analyzeUrlStructure(new URL("http://paypal.secure-login.example.com/auth"));
    const brandSignal = signals.find((signal) => signal.id === "url_brand_impersonation");
    expect(brandSignal).toBeDefined();
    expect(brandSignal?.category).toBe("impersonation");
  });

  it("does not flag the official brand domain", () => {
    expect(ids("https://www.paypal.com/signin")).not.toContain("url_brand_impersonation");
    expect(ids("https://sbi.co.in/netbanking")).not.toContain("url_brand_impersonation");
  });

  it("flags unusual TLDs and executable downloads", () => {
    expect(ids("https://prize-winner.xyz/claim")).toContain("url_suspicious_tld");
    expect(ids("https://example.com/setup.apk")).toContain("url_executable");
  });

  it("flags excessive subdomains", () => {
    expect(ids("https://a.b.c.example.com/x")).toContain("url_deep_subdomains");
  });
});

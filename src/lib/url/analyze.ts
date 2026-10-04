import type { Signal } from "@/lib/types";

const SHORTENER_DOMAINS = [
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "goo.gl",
  "ow.ly",
  "is.gd",
  "buff.ly",
  "cutt.ly",
  "rb.gy",
  "shorturl.at",
  "v.gd",
  "lnkd.in",
  "s.id",
  "tiny.cc",
];

const SUSPICIOUS_TIERS = [
  "xyz",
  "top",
  "click",
  "loan",
  "zip",
  "mov",
  "rest",
  "monster",
  "gq",
  "cf",
  "tk",
  "ml",
  "ga",
  "work",
  "icu",
  "cfd",
];

const URL_KEYWORDS: { word: string; critical: boolean }[] = [
  { word: "otp", critical: true },
  { word: "password", critical: true },
  { word: "verify", critical: true },
  { word: "login", critical: true },
  { word: "kyc", critical: true },
  { word: "account", critical: true },
  { word: "signin", critical: true },
  { word: "secure", critical: false },
  { word: "update", critical: false },
  { word: "confirm", critical: false },
  { word: "wallet", critical: false },
  { word: "gift", critical: false },
  { word: "prize", critical: false },
  { word: "reward", critical: false },
  { word: "suspend", critical: false },
  { word: "unlock", critical: false },
  { word: "validate", critical: false },
  { word: "restricted", critical: false },
];

const BRANDS: { token: string; official: string[] }[] = [
  { token: "paypal", official: ["paypal.com"] },
  { token: "google", official: ["google.com", "google.co.in", "gmail.com"] },
  { token: "whatsapp", official: ["whatsapp.com", "whatsapp.net"] },
  { token: "facebook", official: ["facebook.com"] },
  { token: "instagram", official: ["instagram.com"] },
  { token: "netflix", official: ["netflix.com"] },
  { token: "microsoft", official: ["microsoft.com", "live.com", "outlook.com"] },
  { token: "apple", official: ["apple.com", "icloud.com"] },
  { token: "amazon", official: ["amazon.com", "amazon.in"] },
  { token: "sbi", official: ["sbi.co.in", "onlinesbi.sbi", "sbi.in"] },
  { token: "hdfc", official: ["hdfcbank.com"] },
  { token: "icici", official: ["icicibank.com"] },
  { token: "axis", official: ["axisbank.co.in"] },
  { token: "kotak", official: ["kotak.com"] },
  { token: "paytm", official: ["paytm.com"] },
  { token: "phonepe", official: ["phonepe.com"] },
  { token: "irctc", official: ["irctc.co.in"] },
  { token: "flipkart", official: ["flipkart.com"] },
  { token: "uidai", official: ["uidai.gov.in"] },
  { token: "npci", official: ["npci.org.in"] },
];

const EXECUTABLE_EXTENSIONS = [".exe", ".apk", ".scr", ".bat", ".msi", ".cmd"];

const GENERIC_SECOND_LEVEL = new Set(["co", "com", "org", "net", "gov", "ac", "edu"]);

function registrableDomain(hostname: string): string {
  const labels = hostname.toLowerCase().replace(/\.$/, "").split(".").filter(Boolean);
  if (labels.length <= 2) return labels.join(".");
  const secondLast = labels[labels.length - 2];
  if (GENERIC_SECOND_LEVEL.has(secondLast)) return labels.slice(-3).join(".");
  return labels.slice(-2).join(".");
}

function isIpv4Host(hostname: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname);
}

function truncate(value: string, max = 200): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

/**
 * Static, safe inspection of a URL — the URL is never fetched or executed.
 * Returns structured signals consumed by the shared risk engine.
 */
export function analyzeUrlStructure(url: URL): Signal[] {
  const signals: Signal[] = [];
  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  const href = url.toString();
  const lowerHref = href.toLowerCase();

  const push = (signal: Signal) => signals.push(signal);

  if (url.protocol === "http:") {
    push({
      id: "url_no_https",
      category: "suspicious_url",
      severity: "medium",
      title: "No HTTPS encryption",
      evidence: truncate(href),
      explanation: "The link uses plain HTTP, so anything you type on it can be intercepted.",
    });
  }

  const registrable = registrableDomain(hostname);
  const isShortener = SHORTENER_DOMAINS.some(
    (domain) => registrable === domain || hostname === domain,
  );
  if (isShortener) {
    push({
      id: "url_shortener",
      category: "suspicious_url",
      severity: "high",
      title: "Link shortener hides the destination",
      evidence: truncate(href),
      explanation: "Shortened links mask where they really go, a common trick in scam messages.",
    });
  }

  if (isIpv4Host(hostname) || hostname.includes(":")) {
    push({
      id: "url_ip_host",
      category: "suspicious_url",
      severity: "high",
      title: "Raw IP address as host",
      evidence: truncate(hostname),
      explanation: "Legitimate services use domain names; a raw IP host is a strong warning sign.",
    });
  }

  const hostLabels = hostname.split(".").filter(Boolean);
  const extraSubdomains = hostLabels.length - 2;
  if (extraSubdomains >= 3) {
    push({
      id: "url_deep_subdomains",
      category: "suspicious_url",
      severity: "medium",
      title: "Excessive subdomains",
      evidence: truncate(hostname),
      explanation: "Deeply nested subdomains are often used to make a fake link look legitimate.",
    });
  }

  const matchedKeywords = URL_KEYWORDS.filter((entry) =>
    lowerHref.includes(entry.word),
  ).map((entry) => entry.word);

  if (matchedKeywords.length > 0) {
    const critical = matchedKeywords.some((word) =>
      URL_KEYWORDS.find((entry) => entry.word === word)?.critical,
    );
    push({
      id: "url_suspicious_keywords",
      category: "suspicious_url",
      severity: critical ? "high" : "medium",
      title: "Suspicious wording inside the link",
      evidence: truncate(href),
      explanation: `The link path or query contains wording commonly used in phishing: ${matchedKeywords
        .slice(0, 6)
        .join(", ")}.`,
    });
  }

  const hostTokens = hostname.split(/[.\-]/).filter(Boolean);
  const brandHit = BRANDS.find((brand) => {
    if (!hostTokens.includes(brand.token)) return false;
    return !brand.official.some(
      (official) => registrable === official || registrable.endsWith(`.${official}`),
    );
  });
  if (brandHit) {
    push({
      id: "url_brand_impersonation",
      category: "impersonation",
      severity: "high",
      title: "Brand name used in a look-alike link",
      evidence: truncate(hostname),
      explanation: `The hostname contains "${brandHit.token}" but is not one of its official domains — a classic impersonation pattern.`,
    });
  }

  if (hostname.includes("xn--")) {
    push({
      id: "url_punycode",
      category: "suspicious_url",
      severity: "high",
      title: "Punycode / homoglyph domain",
      evidence: truncate(hostname),
      explanation: "Punycode can make a domain look like a trusted brand while pointing elsewhere.",
    });
  }

  const hyphens = (hostname.match(/-/g) ?? []).length;
  if (hyphens >= 3) {
    push({
      id: "url_hyphen_heavy",
      category: "suspicious_url",
      severity: "medium",
      title: "Hyphen-heavy domain",
      evidence: truncate(hostname),
      explanation: "Domains stuffed with hyphens are frequently registered for one-off phishing pages.",
    });
  }

  const tld = hostLabels[hostLabels.length - 1] ?? "";
  if (SUSPICIOUS_TIERS.includes(tld)) {
    push({
      id: "url_suspicious_tld",
      category: "suspicious_url",
      severity: "medium",
      title: "Unusual domain extension",
      evidence: truncate(`.${tld}`),
      explanation: `.${tld} domains are cheap to register and heavily abused in scam campaigns.`,
    });
  }

  const pathLower = url.pathname.toLowerCase();
  if (EXECUTABLE_EXTENSIONS.some((extension) => pathLower.endsWith(extension))) {
    push({
      id: "url_executable",
      category: "suspicious_url",
      severity: "high",
      title: "Link points to a program file",
      evidence: truncate(url.pathname),
      explanation: "Downloading and running a program from an untrusted link can install malware.",
    });
  }

  if (url.port && url.port !== "443" && url.port !== "80") {
    push({
      id: "url_unusual_port",
      category: "suspicious_url",
      severity: "medium",
      title: "Unusual port number",
      evidence: truncate(`:${url.port}`),
      explanation: "Scam pages often hide on non-standard ports to dodge simple filters.",
    });
  }

  return signals;
}

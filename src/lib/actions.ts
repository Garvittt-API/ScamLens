import type { RecommendedAction, RiskLevel, Signal, SignalCategory } from "@/lib/types";

interface Rule {
  category: SignalCategory;
  priority: RecommendedAction["priority"];
  action: string;
}

const CATEGORY_RULES: Rule[] = [
  {
    category: "credential_request",
    priority: "critical",
    action:
      "Do not share your OTP, password, PIN, or card details with anyone — no genuine bank or service ever asks for them by message.",
  },
  {
    category: "financial_request",
    priority: "critical",
    action:
      "Do not transfer money, pay any fee, or share UPI/payment details because of this message.",
  },
  {
    category: "suspicious_url",
    priority: "critical",
    action:
      "Do not open the link. If you need that service, use the official app or type the website address yourself.",
  },
  {
    category: "threat",
    priority: "high",
    action:
      "Ignore the threat. Accounts are not blocked by surprise messages — check your account directly through the official app.",
  },
  {
    category: "impersonation",
    priority: "high",
    action:
      "Contact the organization through its official website or app — never through a number or link inside this message.",
  },
  {
    category: "reward_lure",
    priority: "medium",
    action:
      "Do not pay any fee to claim a prize or reward. Genuine rewards never require an upfront payment.",
  },
  {
    category: "urgency",
    priority: "medium",
    action:
      "Pause before acting. Urgency is a deliberate tactic — verify the claim independently first.",
  },
];

const DEFAULT_ACTION: RecommendedAction = {
  priority: "medium",
  action:
    "If you are unsure, verify the claim directly with the organization through its official website or app.",
};

const ESCALATION_ACTION: RecommendedAction = {
  priority: "critical",
  action: "Do not reply to this message or share any information with the sender.",
};

const POST_COMPROMISE_ACTION: RecommendedAction = {
  priority: "critical",
  action:
    "If you already shared details or transferred money, contact your bank immediately and report it on the official helpline.",
};

/**
 * Deterministic baseline actions — guaranteed to exist even when the AI provider is down.
 */
export function buildRecommendedActions(
  signals: Signal[],
  level: RiskLevel,
): RecommendedAction[] {
  const categories = new Set(signals.map((signal) => signal.category));
  const actions: RecommendedAction[] = [];

  if (level === "CRITICAL" || level === "HIGH") actions.push(ESCALATION_ACTION);

  for (const rule of CATEGORY_RULES) {
    if (categories.has(rule.category)) actions.push({ priority: rule.priority, action: rule.action });
  }

  if (categories.has("credential_request") || categories.has("financial_request")) {
    actions.push(POST_COMPROMISE_ACTION);
  }

  if (actions.length === 0) actions.push(DEFAULT_ACTION);

  const seen = new Set<string>();
  return actions
    .filter((item) => {
      const key = item.action.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 8);
}

const CATEGORY_SUMMARY_LABELS: Partial<Record<SignalCategory, string>> = {
  credential_request: "credential request",
  financial_request: "financial request",
  suspicious_url: "suspicious link",
  impersonation: "trusted-entity impersonation",
  urgency: "urgency pressure",
  threat: "account threat",
  reward_lure: "prize / reward bait",
};

export function buildDeterministicSummary(signals: Signal[], level: RiskLevel): string {
  if (signals.length === 0) {
    return "No known scam indicators matched this content. This is not a guarantee of safety.";
  }

  const labels = [...new Set(signals.map((signal) => CATEGORY_SUMMARY_LABELS[signal.category]))]
    .filter((label): label is string => Boolean(label))
    .slice(0, 3);

  return `${level} risk — matched ${labels.join(", ") || "multiple"} pattern${labels.length > 1 ? "s" : ""}.`;
}

/**
 * Plain-language explanation built from the detected signals and their evidence.
 * Used as the fallback whenever the AI provider is unavailable.
 */
export function buildDeterministicExplanation(signals: Signal[]): string {
  if (signals.length === 0) {
    return "ScamLens did not match any known scam patterns in this content. That does not prove it is safe — if something still feels wrong, verify through the official channel before acting.";
  }

  const byCategory = new Map<SignalCategory, Signal>();
  for (const signal of signals) {
    if (!byCategory.has(signal.category)) byCategory.set(signal.category, signal);
  }

  const clauses: string[] = [];
  const openers: Record<SignalCategory, string> = {
    urgency: "creates time pressure",
    credential_request: "asks for a sensitive credential",
    financial_request: "asks for money or a payment",
    impersonation: "borrows the identity of a trusted organisation",
    reward_lure: "dangles a prize or reward",
    threat: "uses threats about your account or legal action",
    suspicious_url: "contains a link with suspicious characteristics",
    other: "matches additional suspicious phrasing",
  };

  for (const [category, signal] of byCategory) {
    clauses.push(`${openers[category]} (“${signal.evidence}”)`);
  }

  const joined =
    clauses.length === 1
      ? clauses[0]
      : `${clauses.slice(0, -1).join(", ")}, and ${clauses[clauses.length - 1]}`;

  return `This content ${joined}. These are common social-engineering indicators, so treat the message as untrusted and verify independently before acting.`;
}

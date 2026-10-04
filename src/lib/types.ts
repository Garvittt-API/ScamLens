export type InputType = "text" | "image" | "url";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type Severity = "low" | "medium" | "high" | "critical";

export type SignalCategory =
  | "urgency"
  | "credential_request"
  | "financial_request"
  | "impersonation"
  | "reward_lure"
  | "threat"
  | "suspicious_url"
  | "other";

export interface Signal {
  id: string;
  category: SignalCategory;
  severity: Severity;
  title: string;
  evidence: string;
  explanation: string;
}

export interface Evidence {
  excerpt: string;
  signalIds: string[];
  note: string;
}

export interface RecommendedAction {
  priority: "critical" | "high" | "medium";
  action: string;
}

export interface AIContext {
  summary: string;
  intent: string;
  language: string;
  additional_signals: string[];
  explanation: string;
  recommended_actions: RecommendedAction[];
  confidence_note: string;
  available: boolean;
}

export interface UrlFinding {
  id: string;
  category: SignalCategory;
  severity: Severity;
  title: string;
  evidence: string;
  explanation: string;
}

export interface AnalysisResult {
  id: string;
  input_type: InputType;
  risk_score: number;
  risk_level: RiskLevel;
  summary: string;
  signals: Signal[];
  evidence: Evidence[];
  explanation: string;
  recommended_actions: RecommendedAction[];
  extracted_text: string;
  language: string;
  ai_available: boolean;
  confidence_note: string;
  created_at: string;
}

export interface ApiErrorBody {
  error: string;
  code: string;
}

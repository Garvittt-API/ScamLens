import type { AIContext, InputType, RiskLevel, Signal } from "@/lib/types";

export interface AIRequest {
  content: string;
  inputType: InputType;
  signals: Signal[];
  score: number;
  level: RiskLevel;
}

export interface AIProvider {
  readonly name: string;
  isAvailable(): boolean;
  analyze(request: AIRequest): Promise<AIContext | null>;
}

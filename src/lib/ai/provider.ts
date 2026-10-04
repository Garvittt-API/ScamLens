import type { AIContext } from "@/lib/types";
import { GeminiProvider } from "./gemini";
import type { AIProvider } from "./contract";

export type { AIProvider, AIRequest } from "./contract";

class NullProvider implements AIProvider {
  readonly name = "none";

  isAvailable(): boolean {
    return false;
  }

  async analyze(): Promise<AIContext | null> {
    return null;
  }
}

/**
 * Selects the configured provider. Gemini is the only implemented provider;
 * OpenAI/Claude/Local remain interface-compatible stubs (see ./stubs).
 */
export function getAIProvider(): AIProvider {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (apiKey) return new GeminiProvider(apiKey);
  return new NullProvider();
}

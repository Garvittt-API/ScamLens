import type { AIContext } from "@/lib/types";
import type { AIProvider } from "./contract";

/**
 * Placeholder providers for the AIProvider abstraction.
 * They exist so the interface is real and switching providers later is a one-line change.
 */

abstract class UnimplementedProvider implements AIProvider {
  abstract readonly name: string;

  isAvailable(): boolean {
    return false;
  }

  async analyze(): Promise<AIContext | null> {
    return null;
  }
}

export class OpenAIProvider extends UnimplementedProvider {
  readonly name = "openai";
}

export class ClaudeProvider extends UnimplementedProvider {
  readonly name = "claude";
}

/** Rule-only mode: no model involved, deterministic pipeline still works. */
export class LocalProvider extends UnimplementedProvider {
  readonly name = "local";
}

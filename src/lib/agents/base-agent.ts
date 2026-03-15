import Anthropic from "@anthropic-ai/sdk";
import type { AgentType } from "@/types/cortex";

const client = new Anthropic();

export interface AgentCallOptions {
  agentType: AgentType;
  systemPrompt: string;
  userMessage: string;
  model?: string;
  maxTokens?: number;
  timeoutMs?: number;
}

export interface AgentResult<T> {
  data: T;
  reasoning: string;
  tokensUsed: number;
  durationMs: number;
  model: string;
}

const MAX_RETRIES = 1;
const RETRY_DELAY_MS = 2000;

/**
 * Base agent call pattern with retry and timeout.
 * All 6 CORTEX FC agents use this to call the LLM.
 */
export async function callAgent<T>(
  options: AgentCallOptions
): Promise<AgentResult<T>> {
  const {
    systemPrompt,
    userMessage,
    model = "claude-sonnet-4-20250514",
    maxTokens = 4096,
    timeoutMs = 60000,
  } = options;

  const start = Date.now();
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      const response = await client.messages.create(
        {
          model,
          max_tokens: maxTokens,
          system: systemPrompt,
          messages: [
            {
              role: "user",
              content: userMessage,
            },
          ],
        },
        { signal: controller.signal }
      );

      clearTimeout(timeout);

      const durationMs = Date.now() - start;

      // Extract text content
      const textBlock = response.content.find((block) => block.type === "text");
      const rawText = textBlock && "text" in textBlock ? textBlock.text : "";

      // Parse JSON from response
      let data: T;
      try {
        const jsonMatch =
          rawText.match(/```(?:json)?\s*([\s\S]*?)```/) ||
          rawText.match(/(\{[\s\S]*\})/);
        const jsonStr = jsonMatch ? jsonMatch[1].trim() : rawText.trim();
        data = JSON.parse(jsonStr);
      } catch {
        data = { raw: rawText } as T;
      }

      const tokensUsed =
        (response.usage?.input_tokens || 0) +
        (response.usage?.output_tokens || 0);

      return {
        data,
        reasoning: rawText,
        tokensUsed,
        durationMs,
        model,
      };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      // Only retry on transient errors (429, 500, 503)
      const isRetryable =
        lastError.message.includes("429") ||
        lastError.message.includes("500") ||
        lastError.message.includes("503") ||
        lastError.message.includes("overloaded");

      if (attempt < MAX_RETRIES && isRetryable) {
        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_DELAY_MS * (attempt + 1))
        );
        continue;
      }

      break;
    }
  }

  throw lastError ?? new Error("Agent call failed after retries");
}

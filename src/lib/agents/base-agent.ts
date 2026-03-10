import Anthropic from "@anthropic-ai/sdk";
import type { AgentType } from "@/types/cortex";

const client = new Anthropic();

export interface AgentCallOptions {
  agentType: AgentType;
  systemPrompt: string;
  userMessage: string;
  model?: string;
  maxTokens?: number;
}

export interface AgentResult<T> {
  data: T;
  reasoning: string;
  tokensUsed: number;
  durationMs: number;
  model: string;
}

/**
 * Base agent call pattern
 * All 6 CORTEX FC agents use this to call the LLM
 */
export async function callAgent<T>(
  options: AgentCallOptions
): Promise<AgentResult<T>> {
  const {
    systemPrompt,
    userMessage,
    model = "claude-sonnet-4-20250514",
    maxTokens = 4096,
  } = options;

  const start = Date.now();

  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: userMessage,
      },
    ],
  });

  const durationMs = Date.now() - start;

  // Extract text content
  const textBlock = response.content.find((block) => block.type === "text");
  const rawText = textBlock && "text" in textBlock ? textBlock.text : "";

  // Parse JSON from response (agent prompts instruct JSON output)
  let data: T;
  try {
    // Try to extract JSON from markdown code blocks or raw JSON
    const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/) ||
      rawText.match(/(\{[\s\S]*\})/);
    const jsonStr = jsonMatch ? jsonMatch[1].trim() : rawText.trim();
    data = JSON.parse(jsonStr);
  } catch {
    // If JSON parsing fails, return raw text wrapped
    data = { raw: rawText } as T;
  }

  const tokensUsed =
    (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);

  return {
    data,
    reasoning: rawText,
    tokensUsed,
    durationMs,
    model,
  };
}

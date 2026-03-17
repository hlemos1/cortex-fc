import Anthropic from "@anthropic-ai/sdk";
import type { Tool } from "@anthropic-ai/sdk/resources/messages";
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

/**
 * Streaming variant of callAgent.
 * Streams tokens via callbacks and returns parsed JSON on completion.
 */
export async function callAgentStreaming<T>({
  agentType,
  systemPrompt,
  userMessage,
  model,
  maxTokens,
  onToken,
  onComplete,
}: {
  agentType: string
  systemPrompt: string
  userMessage: string
  model?: string
  maxTokens?: number
  onToken?: (text: string) => void
  onComplete?: (fullText: string) => void
}): Promise<T> {
  const anthropic = new Anthropic()

  const stream = anthropic.messages.stream({
    model: model || "claude-sonnet-4-20250514",
    max_tokens: maxTokens || 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  })

  let fullText = ""

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      fullText += event.delta.text
      onToken?.(event.delta.text)
    }
  }

  onComplete?.(fullText)

  // Parse JSON from the accumulated text
  const jsonMatch =
    fullText.match(/```(?:json)?\s*([\s\S]*?)```/) ||
    fullText.match(/(\{[\s\S]*\})/);
  if (!jsonMatch) throw new Error("No JSON found in response");
  const jsonStr = jsonMatch[1].trim();
  return JSON.parse(jsonStr) as T
}

/**
 * Agent call with tool use support.
 *
 * Allows the agent to call tools (get_player_stats, get_team_squad, etc.)
 * during execution, creating a multi-turn loop until the agent produces
 * a final text response with JSON.
 *
 * Max 5 tool-use loops to prevent runaway calls.
 */
export async function callAgentWithTools<T>({
  agentType,
  systemPrompt,
  userMessage,
  tools,
  executeToolFn,
  model,
  maxTokens,
}: {
  agentType: string;
  systemPrompt: string;
  userMessage: string;
  tools: Tool[];
  executeToolFn: (
    name: string,
    input: Record<string, unknown>
  ) => Promise<string>;
  model?: string;
  maxTokens?: number;
}): Promise<AgentResult<T>> {
  const anthropic = new Anthropic();
  const resolvedModel = model || "claude-sonnet-4-20250514";
  const resolvedMaxTokens = maxTokens || 4096;
  const start = Date.now();
  let totalTokens = 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let messages: any[] = [{ role: "user", content: userMessage }];
  let attempts = 0;
  const maxAttempts = 5;

  while (attempts < maxAttempts) {
    const response = await anthropic.messages.create({
      model: resolvedModel,
      max_tokens: resolvedMaxTokens,
      system: systemPrompt,
      tools,
      messages,
    });

    totalTokens +=
      (response.usage?.input_tokens || 0) +
      (response.usage?.output_tokens || 0);

    // Check if response has tool_use blocks
    const toolUseBlocks = response.content.filter((b) => b.type === "tool_use");

    if (toolUseBlocks.length === 0) {
      // No more tool calls — extract text response
      const textBlock = response.content.find((b) => b.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        throw new Error(`[${agentType}] No text in final response`);
      }

      const rawText = textBlock.text;
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

      return {
        data,
        reasoning: rawText,
        tokensUsed: totalTokens,
        durationMs: Date.now() - start,
        model: resolvedModel,
      };
    }

    // Execute tool calls and add results to conversation
    messages.push({ role: "assistant", content: response.content });

    const toolResults = await Promise.all(
      toolUseBlocks.map(async (block) => {
        if (block.type !== "tool_use") return null;
        const result = await executeToolFn(
          block.name,
          block.input as Record<string, unknown>
        );
        return {
          type: "tool_result" as const,
          tool_use_id: block.id,
          content: result,
        };
      })
    );

    messages.push({
      role: "user",
      content: toolResults.filter(Boolean),
    });

    attempts++;
  }

  throw new Error(
    `[${agentType}] Max tool use attempts (${maxAttempts}) reached`
  );
}

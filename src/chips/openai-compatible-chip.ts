/**
 * OpenAI-compatible ModelChip implementation.
 *
 * Implements the ModelChip interface using the OpenAI API format.
 * Compatible with any OpenAI-compatible endpoint: Ollama, vLLM, LM Studio,
 * local llama.cpp servers, etc.
 *
 * Uses native fetch (Node 18+). No axios or other HTTP dependencies.
 * All network errors are caught and converted to structured responses.
 */

import type {
  ModelChip,
  ChatMessage,
  ChatOptions,
  ChatResponse,
  ChipCapabilities,
  ChipHealth,
  ChipConfig,
} from './types.js';
import {
  DEFAULT_TIMEOUT_MS,
  DEFAULT_MAX_TOKENS,
  DEFAULT_TEMPERATURE,
} from './types.js';

// ============================================================================
// OpenAI API response shapes (internal -- not exported)
// ============================================================================

interface OpenAIChatCompletionResponse {
  id: string;
  model: string;
  choices: Array<{
    message: { content: string };
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

interface OpenAIModelsResponse {
  data: Array<{ id: string; context_length?: number }>;
}

// ============================================================================
// OpenAICompatibleChip
// ============================================================================

/**
 * ModelChip implementation for OpenAI-compatible HTTP APIs.
 *
 * Single parameterized implementation that works against any OpenAI-compatible
 * endpoint. The baseUrl in ChipConfig differentiates backends (Ollama at
 * localhost:11434, vLLM at localhost:8000, LM Studio at localhost:1234, etc.)
 */
export class OpenAICompatibleChip implements ModelChip {
  readonly name: string;
  readonly type: 'openai-compatible' = 'openai-compatible';

  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly defaultModel: string;

  /**
   * Create an OpenAI-compatible chip.
   *
   * @param config - Chip configuration; must have type='openai-compatible' and baseUrl
   * @throws Error if config.type !== 'openai-compatible'
   */
  constructor(config: ChipConfig) {
    if (config.type !== 'openai-compatible') {
      throw new Error(
        `OpenAICompatibleChip requires type='openai-compatible', got '${config.type}'`,
      );
    }

    this.name = config.name;
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // strip trailing slash
    this.apiKey = config.apiKey;
    this.defaultModel = config.defaultModel;
  }

  /**
   * Send a chat completion request to {baseUrl}/v1/chat/completions.
   *
   * @param messages - Conversation messages to send
   * @param options - Optional overrides for model, temperature, maxTokens
   * @returns Parsed ChatResponse
   * @throws Error on HTTP error or unrecoverable network failure
   */
  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    const model = options?.model ?? this.defaultModel;
    const body = {
      model,
      messages,
      temperature: options?.temperature ?? DEFAULT_TEMPERATURE,
      max_tokens: options?.maxTokens ?? DEFAULT_MAX_TOKENS,
    };

    const headers: Record<string, string> = {
      'content-type': 'application/json',
    };
    if (this.apiKey) {
      headers['authorization'] = `Bearer ${this.apiKey}`;
    }

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(
        `OpenAI-compatible chip '${this.name}' chat failed: HTTP ${response.status} - ${text}`,
      );
    }

    const data = await response.json() as OpenAIChatCompletionResponse;
    return {
      content: data.choices[0].message.content,
      model: data.model,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
      },
    };
  }

  /**
   * Check endpoint health by GETting {baseUrl}/v1/models.
   *
   * @returns ChipHealth with availability, latency, and timestamp
   */
  async health(): Promise<ChipHealth> {
    const lastChecked = new Date().toISOString();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
    const start = Date.now();

    try {
      const response = await fetch(`${this.baseUrl}/v1/models`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const latencyMs = Date.now() - start;

      if (!response.ok) {
        return { available: false, latencyMs: null, lastChecked };
      }

      return { available: true, latencyMs, lastChecked };
    } catch {
      clearTimeout(timeoutId);
      return { available: false, latencyMs: null, lastChecked };
    }
  }

  /**
   * Query available models from {baseUrl}/v1/models.
   *
   * Falls back to single-model list using config.defaultModel if endpoint
   * is unavailable or returns an error.
   *
   * @returns ChipCapabilities with model list and feature flags
   */
  async capabilities(): Promise<ChipCapabilities> {
    const fallback: ChipCapabilities = {
      models: [this.defaultModel],
      maxContextLength: DEFAULT_MAX_TOKENS,
      supportsStreaming: false,
      supportsTools: false,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    try {
      const response = await fetch(`${this.baseUrl}/v1/models`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        return fallback;
      }

      const data = await response.json() as OpenAIModelsResponse;
      const models = data.data.map((m) => m.id);

      // Derive max context from first model that reports it, default 4096
      const maxContextLength =
        data.data.find((m) => m.context_length != null)?.context_length ?? DEFAULT_MAX_TOKENS;

      return {
        models,
        maxContextLength,
        supportsStreaming: false,
        supportsTools: false,
      };
    } catch {
      clearTimeout(timeoutId);
      return fallback;
    }
  }
}

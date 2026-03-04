/**
 * OpenAI-compatible ModelChip implementation.
 *
 * Implements the ModelChip interface using the OpenAI API format.
 * Compatible with any OpenAI-compatible endpoint: Ollama, vLLM, LM Studio,
 * local llama.cpp servers, etc.
 *
 * Uses HttpClient for all HTTP operations — retry, timeout, streaming, error classification.
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
import { HttpClient } from './http-client.js';
import { OllamaDiscovery } from './ollama-discovery.js';
import type { DiscoveryResult } from './ollama-discovery.js';

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
  private readonly httpClient: HttpClient;
  private readonly healthClient: HttpClient;

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

    // Main client: retries on transient failures
    this.httpClient = new HttpClient({
      maxRetries: 3,
      baseDelayMs: 500,
      maxDelayMs: 8000,
      timeoutMs: DEFAULT_TIMEOUT_MS,
    });

    // Health client: no retries for fast failure detection
    this.healthClient = new HttpClient({
      maxRetries: 0,
      timeoutMs: DEFAULT_TIMEOUT_MS,
    });
  }

  /**
   * Send a chat completion request to {baseUrl}/v1/chat/completions.
   * Supports optional streaming via options.stream.
   */
  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
    const model = options?.model ?? this.defaultModel;
    const body = {
      model,
      messages,
      temperature: options?.temperature ?? DEFAULT_TEMPERATURE,
      max_tokens: options?.maxTokens ?? DEFAULT_MAX_TOKENS,
      ...(options?.stream ? { stream: true } : {}),
    };

    const headers: Record<string, string> = {};
    if (this.apiKey) {
      headers['authorization'] = `Bearer ${this.apiKey}`;
    }

    // Streaming path
    if (options?.stream) {
      const result = await this.httpClient.stream(
        `${this.baseUrl}/v1/chat/completions`,
        body,
        headers,
      );
      if (!result.ok || !result.data) {
        throw new Error(
          `OpenAI-compatible chip '${this.name}' stream failed: ${result.error ?? 'unknown'}`,
        );
      }
      return {
        ...result.data,
        model,
      };
    }

    // Standard path
    const result = await this.httpClient.post<OpenAIChatCompletionResponse>(
      `${this.baseUrl}/v1/chat/completions`,
      body,
      headers,
    );

    if (!result.ok || !result.data) {
      throw new Error(
        `OpenAI-compatible chip '${this.name}' chat failed: ${result.error ?? `HTTP ${result.status}`}`,
      );
    }

    const data = result.data;
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
   * Uses no-retry client for fast failure detection.
   */
  async health(): Promise<ChipHealth> {
    const lastChecked = new Date().toISOString();
    const start = Date.now();

    const result = await this.healthClient.get(`${this.baseUrl}/v1/models`);
    const latencyMs = Date.now() - start;

    if (result.ok) {
      return { available: true, latencyMs, lastChecked };
    }

    return { available: false, latencyMs: null, lastChecked };
  }

  /**
   * Query available models from {baseUrl}/v1/models.
   */
  async capabilities(): Promise<ChipCapabilities> {
    const fallback: ChipCapabilities = {
      models: [this.defaultModel],
      maxContextLength: DEFAULT_MAX_TOKENS,
      supportsStreaming: true,
      supportsTools: false,
    };

    const result = await this.healthClient.get<OpenAIModelsResponse>(
      `${this.baseUrl}/v1/models`,
    );

    if (!result.ok || !result.data) {
      return fallback;
    }

    const data = result.data;
    const models = data.data.map((m) => m.id);
    const maxContextLength =
      data.data.find((m) => m.context_length != null)?.context_length ?? DEFAULT_MAX_TOKENS;

    return {
      models,
      maxContextLength,
      supportsStreaming: true,
      supportsTools: false,
    };
  }

  /**
   * Probe an endpoint and discover available models.
   * Tries Ollama /api/tags first, falls back to /v1/models.
   */
  static async discover(baseUrl: string): Promise<DiscoveryResult> {
    const httpClient = new HttpClient({ maxRetries: 0, timeoutMs: 5000 });
    const discovery = new OllamaDiscovery(httpClient);
    return discovery.discover(baseUrl);
  }
}

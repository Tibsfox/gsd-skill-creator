/**
 * Anthropic ModelChip implementation.
 *
 * Wraps the Anthropic Messages API behind the ModelChip interface.
 * Converts the shared ChatMessage[] format to Anthropic's API format:
 * system messages are extracted into a top-level `system` field,
 * remaining messages form the `messages` array.
 *
 * Uses native fetch (Node 18+). API key resolved from config or env.
 * Health check validates API key by sending a minimal request.
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
import { DEFAULT_TIMEOUT_MS, DEFAULT_MAX_TOKENS, DEFAULT_TEMPERATURE } from './types.js';

// ============================================================================
// Anthropic API response shapes (internal -- not exported)
// ============================================================================

interface AnthropicMessagesResponse {
  id: string;
  model: string;
  content: Array<{ type: string; text: string }>;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
  stop_reason: string;
}

// ============================================================================
// Known Claude models (hardcoded -- no models listing endpoint in Anthropic API)
// ============================================================================

interface ClaudeModelInfo {
  id: string;
  contextLength: number;
}

/**
 * Known Claude models with their context lengths.
 * Listed in order of preference (most capable first).
 */
const KNOWN_CLAUDE_MODELS: readonly ClaudeModelInfo[] = Object.freeze([
  { id: 'claude-opus-4-20250514', contextLength: 200000 },
  { id: 'claude-sonnet-4-20250514', contextLength: 200000 },
  { id: 'claude-haiku-3-20250303', contextLength: 200000 },
  { id: 'claude-3-5-sonnet-20241022', contextLength: 200000 },
  { id: 'claude-3-5-haiku-20241022', contextLength: 200000 },
  { id: 'claude-3-opus-20240229', contextLength: 200000 },
]);

const ANTHROPIC_API_BASE = 'https://api.anthropic.com';
const ANTHROPIC_VERSION = '2023-06-01';

// ============================================================================
// AnthropicChip
// ============================================================================

/**
 * ModelChip implementation for the Anthropic Messages API.
 *
 * Converts ChatMessage[] to Anthropic format: extracts system messages into
 * the top-level `system` parameter. Capabilities are hardcoded (no listing
 * endpoint in the Anthropic API).
 *
 * API key priority: config.apiKey > ANTHROPIC_API_KEY env var.
 */
export class AnthropicChip implements ModelChip {
  readonly name: string;
  readonly type: 'anthropic' = 'anthropic';

  private readonly apiKey: string | undefined;
  private readonly defaultModel: string;

  /**
   * Create an Anthropic chip.
   *
   * @param config - Chip configuration; must have type='anthropic'
   * @throws Error if config.type !== 'anthropic'
   */
  constructor(config: ChipConfig) {
    if (config.type !== 'anthropic') {
      throw new Error(
        `AnthropicChip requires type='anthropic', got '${config.type}'`,
      );
    }

    this.name = config.name;
    this.defaultModel = config.defaultModel;
    // Resolve API key: config value takes priority over environment variable
    this.apiKey = config.apiKey ?? process.env['ANTHROPIC_API_KEY'];
  }

  /**
   * Send a chat completion request to the Anthropic Messages API.
   *
   * Converts messages: extracts the first system message into the `system`
   * top-level field; remaining messages (user/assistant) go in `messages`.
   *
   * @param messages - Conversation messages
   * @param options - Optional overrides for model, temperature, maxTokens
   * @returns Parsed ChatResponse
   * @throws Error on HTTP error (including 401 authentication failure)
   */
  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    const model = options?.model ?? this.defaultModel;

    // Extract system message (if any) into Anthropic's top-level system param
    const systemMessage = messages.find((m) => m.role === 'system');
    const conversationMessages = messages.filter((m) => m.role !== 'system');

    const body: Record<string, unknown> = {
      model,
      messages: conversationMessages,
      max_tokens: options?.maxTokens ?? DEFAULT_MAX_TOKENS,
      temperature: options?.temperature ?? DEFAULT_TEMPERATURE,
    };

    if (systemMessage) {
      body['system'] = systemMessage.content;
    }

    let response: Response;
    try {
      response = await fetch(`${ANTHROPIC_API_BASE}/v1/messages`, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(
        `Anthropic chip '${this.name}' chat failed: HTTP ${response.status} - ${text}`,
      );
    }

    const data = await response.json() as AnthropicMessagesResponse;
    const textContent = data.content.find((c) => c.type === 'text');

    return {
      content: textContent?.text ?? '',
      model: data.model,
      usage: {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
      },
    };
  }

  /**
   * Validate the API key by sending a minimal messages request.
   *
   * HTTP 200 or 400 (bad payload but auth passed) = available.
   * HTTP 401 (authentication failed) = unavailable.
   * Network error = unavailable.
   *
   * @returns ChipHealth with availability, latency, and timestamp
   */
  async health(): Promise<ChipHealth> {
    const lastChecked = new Date().toISOString();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
    const start = Date.now();

    // Minimal request body to validate auth -- intentionally small
    const body = {
      model: this.defaultModel,
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 1,
    };

    try {
      const response = await fetch(`${ANTHROPIC_API_BASE}/v1/messages`, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const latencyMs = Date.now() - start;

      // 401 = invalid key; any other status = key is valid (server received request)
      if (response.status === 401) {
        return { available: false, latencyMs: null, lastChecked };
      }

      return { available: true, latencyMs, lastChecked };
    } catch {
      clearTimeout(timeoutId);
      return { available: false, latencyMs: null, lastChecked };
    }
  }

  /**
   * Return hardcoded Claude model list with known context lengths.
   *
   * Anthropic does not expose a model listing endpoint, so capabilities
   * are derived from the KNOWN_CLAUDE_MODELS table. No HTTP call is made.
   *
   * @returns ChipCapabilities with known Claude models
   */
  async capabilities(): Promise<ChipCapabilities> {
    const models = KNOWN_CLAUDE_MODELS.map((m) => m.id);
    // All known Claude models share the same context length (200K)
    const maxContextLength = KNOWN_CLAUDE_MODELS[0]?.contextLength ?? DEFAULT_MAX_TOKENS;

    return {
      models,
      maxContextLength,
      supportsStreaming: false,
      supportsTools: true,
    };
  }

  // ============================================================================
  // Private helpers
  // ============================================================================

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'anthropic-version': ANTHROPIC_VERSION,
      'content-type': 'application/json',
    };
    if (this.apiKey) {
      headers['x-api-key'] = this.apiKey;
    }
    return headers;
  }
}

/**
 * HttpClient -- HTTP client with retry, timeout, SSE streaming, and error classification.
 *
 * Uses native fetch (Node 18+). No axios, no node-fetch, no got.
 * All errors return result objects -- no throw in business logic paths.
 *
 * Retry strategy: exponential backoff with jitter on network errors and 429.
 * Never retries 4xx (model errors) or timeout (caller chose the timeout).
 */

import type { ErrorCategory, ChatResponse } from './types.js';

// ============================================================================
// Configuration
// ============================================================================

export interface HttpClientConfig {
  /** Maximum retry attempts (default 3) */
  maxRetries: number;
  /** Base delay in ms before first retry (default 500) */
  baseDelayMs: number;
  /** Maximum delay cap in ms (default 8000) */
  maxDelayMs: number;
  /** Multiplier for exponential backoff (default 2) */
  backoffMultiplier: number;
  /** Request timeout in ms via AbortController (default 30000) */
  timeoutMs: number;
  /** Send Connection: keep-alive header (default true) */
  keepAlive: boolean;
}

const DEFAULT_CONFIG: HttpClientConfig = {
  maxRetries: 3,
  baseDelayMs: 500,
  maxDelayMs: 8000,
  backoffMultiplier: 2,
  timeoutMs: 30000,
  keepAlive: true,
};

// ============================================================================
// Result types
// ============================================================================

export interface HttpResult<T> {
  ok: boolean;
  data?: T;
  status?: number;
  error?: string;
  errorCategory?: ErrorCategory;
  attempts: number;
  totalLatencyMs: number;
}

// ============================================================================
// Error classification
// ============================================================================

/**
 * Classify an error into one of four categories.
 *
 * @param err - The thrown error or unknown value
 * @param statusCode - Optional HTTP status code from response
 * @returns ErrorCategory for retry/reporting decisions
 */
export function classifyError(err: unknown, statusCode?: number): ErrorCategory {
  if (statusCode === 429) return 'rate-limit';
  if (statusCode !== undefined && statusCode >= 400 && statusCode < 500) return 'model';
  if (err instanceof DOMException && err.name === 'AbortError') return 'timeout';
  return 'network';
}

/**
 * Whether a given error category should trigger a retry.
 * Retries: network, rate-limit. No retry: model, timeout.
 */
function shouldRetry(category: ErrorCategory): boolean {
  return category === 'network' || category === 'rate-limit';
}

/**
 * Calculate retry delay with exponential backoff and jitter.
 * Formula: min(baseDelay * multiplier^attempt + jitter, maxDelay)
 * Jitter: random * 0.1 * baseDelay to prevent thundering herd.
 */
function calculateDelay(attempt: number, config: HttpClientConfig): number {
  const exponential = config.baseDelayMs * Math.pow(config.backoffMultiplier, attempt);
  const jitter = Math.random() * 0.1 * config.baseDelayMs;
  return Math.min(exponential + jitter, config.maxDelayMs);
}

// ============================================================================
// SSE Parser
// ============================================================================

/**
 * Parse an SSE stream from a ReadableStream, calling onChunk for each token.
 * Returns aggregated content string.
 */
async function parseSSEStream(
  body: ReadableStream<Uint8Array>,
  onChunk: (token: string) => void,
): Promise<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let aggregated = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE events (terminated by \n\n)
      const events = buffer.split('\n\n');
      // Last element is either empty or a partial event
      buffer = events.pop() ?? '';

      for (const event of events) {
        const lines = event.split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data) as {
              choices?: Array<{ delta?: { content?: string } }>;
            };
            const token = parsed.choices?.[0]?.delta?.content;
            if (token !== undefined && token !== null) {
              onChunk(token);
              aggregated += token;
            }
          } catch {
            // Skip malformed JSON chunks
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return aggregated;
}

// ============================================================================
// HttpClient
// ============================================================================

export class HttpClient {
  private readonly config: HttpClientConfig;

  constructor(config?: Partial<HttpClientConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Perform a GET request with retry logic.
   */
  async get<T>(url: string, headers?: Record<string, string>): Promise<HttpResult<T>> {
    return this._fetch<T>('GET', url, undefined, headers);
  }

  /**
   * Perform a POST request with retry logic.
   */
  async post<T>(url: string, body: unknown, headers?: Record<string, string>): Promise<HttpResult<T>> {
    return this._fetch<T>('POST', url, body, headers);
  }

  /**
   * Perform a streaming POST request with SSE parsing.
   * Returns aggregated ChatResponse after stream completes.
   */
  async stream(
    url: string,
    body: unknown,
    headers?: Record<string, string>,
    onChunk?: (token: string) => void,
  ): Promise<HttpResult<ChatResponse>> {
    const start = Date.now();
    const mergedHeaders: Record<string, string> = {
      'content-type': 'application/json',
      ...(this.config.keepAlive ? { connection: 'keep-alive' } : {}),
      ...headers,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: mergedHeaders,
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const category = classifyError(new Error(`HTTP ${response.status}`), response.status);
        return {
          ok: false,
          status: response.status,
          error: `HTTP ${response.status}`,
          errorCategory: category,
          attempts: 1,
          totalLatencyMs: Date.now() - start,
        };
      }

      if (!response.body) {
        return {
          ok: false,
          error: 'No response body for streaming',
          errorCategory: 'network',
          attempts: 1,
          totalLatencyMs: Date.now() - start,
        };
      }

      const content = await parseSSEStream(response.body, onChunk ?? (() => {}));

      return {
        ok: true,
        data: {
          content,
          model: 'stream',
          usage: { promptTokens: 0, completionTokens: 0 },
        } as ChatResponse,
        status: 200,
        attempts: 1,
        totalLatencyMs: Date.now() - start,
      };
    } catch (err) {
      clearTimeout(timeoutId);
      const category = classifyError(err);
      return {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
        errorCategory: category,
        attempts: 1,
        totalLatencyMs: Date.now() - start,
      };
    }
  }

  /**
   * Internal fetch with retry loop.
   */
  private async _fetch<T>(
    method: string,
    url: string,
    body?: unknown,
    headers?: Record<string, string>,
  ): Promise<HttpResult<T>> {
    const start = Date.now();
    const mergedHeaders: Record<string, string> = {
      'content-type': 'application/json',
      ...(this.config.keepAlive ? { connection: 'keep-alive' } : {}),
      ...headers,
    };

    let lastError: string | undefined;
    let lastCategory: ErrorCategory | undefined;
    let lastStatus: number | undefined;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      // Wait before retry (skip for first attempt)
      if (attempt > 0) {
        const delay = calculateDelay(attempt - 1, this.config);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

      try {
        const response = await fetch(url, {
          method,
          headers: mergedHeaders,
          ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = (await response.json()) as T;
          return {
            ok: true,
            data,
            status: response.status,
            attempts: attempt + 1,
            totalLatencyMs: Date.now() - start,
          };
        }

        // Non-ok response
        const category = classifyError(new Error(`HTTP ${response.status}`), response.status);
        lastError = `HTTP ${response.status}`;
        lastCategory = category;
        lastStatus = response.status;

        if (!shouldRetry(category)) {
          // Don't retry 4xx errors
          return {
            ok: false,
            status: response.status,
            error: lastError,
            errorCategory: category,
            attempts: attempt + 1,
            totalLatencyMs: Date.now() - start,
          };
        }
      } catch (err) {
        clearTimeout(timeoutId);
        const category = classifyError(err);
        lastError = err instanceof Error ? err.message : String(err);
        lastCategory = category;
        lastStatus = undefined;

        if (!shouldRetry(category)) {
          return {
            ok: false,
            error: lastError,
            errorCategory: category,
            attempts: attempt + 1,
            totalLatencyMs: Date.now() - start,
          };
        }
      }
    }

    // Exhausted all retries
    return {
      ok: false,
      status: lastStatus,
      error: lastError,
      errorCategory: lastCategory,
      attempts: this.config.maxRetries + 1,
      totalLatencyMs: Date.now() - start,
    };
  }
}

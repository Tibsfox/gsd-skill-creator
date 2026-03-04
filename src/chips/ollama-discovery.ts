/**
 * OllamaDiscovery -- live model enumeration from Ollama/vLLM endpoints
 * and health state machine with cold-start detection.
 *
 * Probes /api/tags (Ollama-native) first, falls back to /v1/models (OpenAI-compat).
 * Health state machine: unknown → checking → healthy/degraded/unhealthy.
 * Cold-start detection: slow-but-alive responses marked as 'degraded' not 'unhealthy'.
 */

import type { HttpClient, HttpResult } from './http-client.js';

// ============================================================================
// Types
// ============================================================================

export interface OllamaModel {
  name: string;
  size: number;
  parameterSize: string;
  quantizationLevel: string;
  family: string;
  contextLength: number;
}

export interface DiscoveryResult {
  available: boolean;
  isOllama: boolean;
  models: OllamaModel[];
  endpoint: string;
}

export type HealthState = 'unknown' | 'checking' | 'healthy' | 'degraded' | 'unhealthy';

export interface HealthTransition {
  from: HealthState;
  to: HealthState;
  reason: string;
  timestamp: string;
}

// ============================================================================
// Ollama API response shapes
// ============================================================================

interface OllamaTagsResponse {
  models: Array<{
    name: string;
    model?: string;
    size: number;
    digest: string;
    details: {
      parameter_size: string;
      quantization_level: string;
      family: string;
    };
  }>;
}

interface OllamaShowResponse {
  modelfile?: string;
  parameters?: string;
  template?: string;
  details: {
    parameter_size: string;
    quantization_level: string;
    families?: string[];
    family: string;
  };
}

interface OpenAIModelsResponse {
  data: Array<{ id: string; context_length?: number }>;
}

// ============================================================================
// OllamaDiscovery
// ============================================================================

export class OllamaDiscovery {
  constructor(private readonly httpClient: HttpClient) {}

  /**
   * Discover available models from an endpoint.
   * Tries Ollama-native /api/tags first, falls back to /v1/models.
   */
  async discover(baseUrl: string): Promise<DiscoveryResult> {
    const url = baseUrl.replace(/\/$/, '');

    // Try Ollama-native first
    const ollamaResult = await this.httpClient.get<OllamaTagsResponse>(`${url}/api/tags`);

    if (ollamaResult.ok && ollamaResult.data?.models) {
      const models: OllamaModel[] = [];
      for (const m of ollamaResult.data.models) {
        const details = await this.getModelDetails(url, m.name);
        models.push(
          details ?? {
            name: m.name,
            size: m.size,
            parameterSize: m.details.parameter_size,
            quantizationLevel: m.details.quantization_level,
            family: m.details.family,
            contextLength: 2048, // default fallback
          },
        );
      }
      return { available: true, isOllama: true, models, endpoint: url };
    }

    // Fallback to OpenAI-compat
    const openaiResult = await this.httpClient.get<OpenAIModelsResponse>(`${url}/v1/models`);

    if (openaiResult.ok && openaiResult.data?.data) {
      const models: OllamaModel[] = openaiResult.data.data.map((m) => ({
        name: m.id,
        size: 0,
        parameterSize: 'unknown',
        quantizationLevel: 'unknown',
        family: 'unknown',
        contextLength: m.context_length ?? 2048,
      }));
      return { available: true, isOllama: false, models, endpoint: url };
    }

    // Neither endpoint worked
    return { available: false, isOllama: false, models: [], endpoint: url };
  }

  /**
   * Get detailed model info from Ollama /api/show.
   * Returns null if model not found or endpoint unavailable.
   */
  async getModelDetails(baseUrl: string, modelName: string): Promise<OllamaModel | null> {
    const url = baseUrl.replace(/\/$/, '');
    const result = await this.httpClient.post<OllamaShowResponse>(
      `${url}/api/show`,
      { name: modelName },
    );

    if (!result.ok || !result.data) return null;

    const data = result.data;
    // Parse context length from parameters string: "num_ctx <number>"
    let contextLength = 2048;
    if (data.parameters) {
      const match = data.parameters.match(/num_ctx\s+(\d+)/);
      if (match) {
        contextLength = parseInt(match[1]!, 10);
      }
    }

    return {
      name: modelName,
      size: 0, // /api/show doesn't return size
      parameterSize: data.details.parameter_size,
      quantizationLevel: data.details.quantization_level,
      family: data.details.family,
      contextLength,
    };
  }
}

// ============================================================================
// HealthStateMachine
// ============================================================================

/** Threshold for detecting cold-start / model-loading (ms) */
const DEGRADED_LATENCY_THRESHOLD = 5000;

export class HealthStateMachine {
  private _state: HealthState = 'unknown';
  private _history: HealthTransition[] = [];

  get state(): HealthState {
    return this._state;
  }

  get history(): HealthTransition[] {
    return [...this._history];
  }

  /**
   * Transition to a new state with a reason.
   */
  transition(to: HealthState, reason: string): void {
    const from = this._state;
    if (from === to) return; // no-op for same state
    this._history.push({
      from,
      to,
      reason,
      timestamp: new Date().toISOString(),
    });
    this._state = to;
  }

  /**
   * Probe an endpoint and update health state.
   * Uses /api/tags for Ollama endpoints with short timeout.
   */
  async probe(baseUrl: string, httpClient: HttpClient): Promise<HealthState> {
    const url = baseUrl.replace(/\/$/, '');
    const wasUnknown = this._state === 'unknown';
    this.transition('checking', 'probe started');

    const start = Date.now();
    const result = await httpClient.get(`${url}/api/tags`);
    const latencyMs = Date.now() - start;

    if (result.ok) {
      if (latencyMs > DEGRADED_LATENCY_THRESHOLD) {
        // Slow but alive — model loading or cold start
        this.transition('degraded', wasUnknown
          ? `cold-start detected: response took ${latencyMs}ms`
          : `slow response: ${latencyMs}ms (threshold: ${DEGRADED_LATENCY_THRESHOLD}ms)`,
        );
      } else {
        this.transition('healthy', `probe succeeded in ${latencyMs}ms`);
      }
    } else {
      this.transition('unhealthy', `probe failed: ${result.error ?? 'unknown error'}`);
    }

    return this._state;
  }
}

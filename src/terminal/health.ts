/**
 * Wetty health check probe.
 *
 * Performs an HTTP GET against the Wetty URL to determine whether
 * the service is running and responsive. Returns structured result
 * with healthy flag, status code, response time, and error details.
 *
 * @module terminal/health
 */

import type { HealthCheckResult } from './types.js';

/** Default timeout for health check probes (ms). */
const DEFAULT_TIMEOUT_MS = 3000;

/**
 * Probe a Wetty endpoint to check service health.
 *
 * Performs an HTTP GET to the given URL with a configurable timeout.
 * Returns a structured result indicating whether the service is
 * healthy, the HTTP status code, response time, and any error.
 *
 * Uses native fetch with AbortSignal.timeout() for clean timeout
 * enforcement. Does not append any path to the URL -- probes the
 * exact URL provided.
 *
 * @param url - The Wetty URL to probe (e.g., http://localhost:3000/terminal)
 * @param timeoutMs - Timeout in milliseconds (default 3000)
 * @returns Health check result with healthy flag, status, timing, and errors
 */
export async function checkHealth(url: string, timeoutMs: number = DEFAULT_TIMEOUT_MS): Promise<HealthCheckResult> {
  const start = Date.now();

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(timeoutMs),
    });

    const elapsed = Date.now() - start;

    return {
      healthy: response.ok,
      statusCode: response.status,
      responseTimeMs: elapsed,
      error: null,
    };
  } catch (err: unknown) {
    const elapsed = Date.now() - start;
    const error = err instanceof Error ? err : new Error(String(err));

    // Detect timeout (AbortSignal.timeout throws TimeoutError or AbortError)
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return {
        healthy: false,
        statusCode: null,
        responseTimeMs: elapsed,
        error: `Health check timed out after ${timeoutMs}ms`,
      };
    }

    // Connection refused or other fetch failures
    // Node's native fetch wraps the cause; extract it if available
    const cause = (error as Error & { cause?: Error }).cause;
    const errorMessage = cause?.message ?? error.message;

    return {
      healthy: false,
      statusCode: null,
      responseTimeMs: elapsed,
      error: errorMessage,
    };
  }
}

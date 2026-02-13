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

/**
 * Probe a Wetty endpoint to check service health.
 *
 * @param _url - The Wetty URL to probe
 * @param _timeoutMs - Timeout in milliseconds (default 3000)
 * @returns Health check result with healthy flag, status, timing, and errors
 */
export async function checkHealth(_url: string, _timeoutMs?: number): Promise<HealthCheckResult> {
  throw new Error('not implemented');
}

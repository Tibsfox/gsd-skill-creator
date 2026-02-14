/**
 * Tests for the Wetty health check probe.
 *
 * All tests mock global.fetch to avoid real HTTP requests.
 * Covers: healthy responses, connection refused, timeouts,
 * non-200 status codes, and URL handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkHealth } from './health.js';

// Save original fetch so we can restore after each test
const originalFetch = globalThis.fetch;

beforeEach(() => {
  globalThis.fetch = vi.fn();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('checkHealth', () => {
  describe('healthy service', () => {
    it('returns healthy=true when URL responds with 200', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValue(
        new Response('ok', { status: 200 }),
      );

      const result = await checkHealth('http://localhost:3000/terminal');

      expect(result.healthy).toBe(true);
    });

    it('returns statusCode=200 for successful probe', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValue(
        new Response('ok', { status: 200 }),
      );

      const result = await checkHealth('http://localhost:3000/terminal');

      expect(result.statusCode).toBe(200);
    });

    it('returns responseTimeMs as a positive number', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValue(
        new Response('ok', { status: 200 }),
      );

      const result = await checkHealth('http://localhost:3000/terminal');

      expect(result.responseTimeMs).toBeGreaterThanOrEqual(0);
      expect(typeof result.responseTimeMs).toBe('number');
    });
  });

  describe('unhealthy service -- connection refused', () => {
    it('returns healthy=false when connection is refused', async () => {
      const err = new TypeError('fetch failed');
      (err as unknown as Record<string, unknown>).cause = new Error(
        'connect ECONNREFUSED 127.0.0.1:3000',
      );
      vi.mocked(globalThis.fetch).mockRejectedValue(err);

      const result = await checkHealth('http://localhost:3000/terminal');

      expect(result.healthy).toBe(false);
    });

    it('returns statusCode=null when no response received', async () => {
      const err = new TypeError('fetch failed');
      (err as unknown as Record<string, unknown>).cause = new Error(
        'connect ECONNREFUSED 127.0.0.1:3000',
      );
      vi.mocked(globalThis.fetch).mockRejectedValue(err);

      const result = await checkHealth('http://localhost:3000/terminal');

      expect(result.statusCode).toBeNull();
    });

    it('returns error message containing connection error text', async () => {
      const err = new TypeError('fetch failed');
      (err as unknown as Record<string, unknown>).cause = new Error(
        'connect ECONNREFUSED 127.0.0.1:3000',
      );
      vi.mocked(globalThis.fetch).mockRejectedValue(err);

      const result = await checkHealth('http://localhost:3000/terminal');

      expect(result.error).toBeTruthy();
      expect(result.error).toMatch(/ECONNREFUSED|fetch failed|connection/i);
    });
  });

  describe('unhealthy service -- timeout', () => {
    it('returns healthy=false when request exceeds timeout', async () => {
      const abortError = new DOMException(
        'The operation was aborted due to timeout',
        'TimeoutError',
      );
      vi.mocked(globalThis.fetch).mockRejectedValue(abortError);

      const result = await checkHealth('http://localhost:3000/terminal', 3000);

      expect(result.healthy).toBe(false);
    });

    it('returns error message indicating timeout', async () => {
      const abortError = new DOMException(
        'The operation was aborted due to timeout',
        'TimeoutError',
      );
      vi.mocked(globalThis.fetch).mockRejectedValue(abortError);

      const result = await checkHealth('http://localhost:3000/terminal', 3000);

      expect(result.error).toBeTruthy();
      expect(result.error).toMatch(/timed? ?out|timeout/i);
    });
  });

  describe('unhealthy service -- non-200 status', () => {
    it('returns healthy=false when server returns 500', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValue(
        new Response('Internal Server Error', { status: 500 }),
      );

      const result = await checkHealth('http://localhost:3000/terminal');

      expect(result.healthy).toBe(false);
    });

    it('returns statusCode=500 when server returns 500', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValue(
        new Response('Internal Server Error', { status: 500 }),
      );

      const result = await checkHealth('http://localhost:3000/terminal');

      expect(result.statusCode).toBe(500);
    });
  });

  describe('URL construction', () => {
    it('probes the exact URL passed (no path appending)', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValue(
        new Response('ok', { status: 200 }),
      );

      await checkHealth('http://localhost:3000/terminal');

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/terminal',
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
    });

    it('works with trailing slash in URL', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValue(
        new Response('ok', { status: 200 }),
      );

      await checkHealth('http://localhost:3000/terminal/');

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/terminal/',
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
    });
  });
});

/**
 * HttpClient unit tests — uses node:http mock servers to test retry, timeout,
 * streaming, and error classification without real network dependencies.
 *
 * Phase 55, Plan 01: RED phase — these tests drive the implementation in
 * src/chips/http-client.ts.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as http from 'node:http';
import type { AddressInfo } from 'node:net';
import { HttpClient, classifyError } from './http-client.js';
import type { HttpClientConfig } from './http-client.js';

// ============================================================================
// Helpers
// ============================================================================

/**
 * Spin up a simple HTTP server with a programmable handler.
 * Returns the base URL and a close() function.
 */
function makeServer(
  handler: (req: http.IncomingMessage, res: http.ServerResponse) => void,
): Promise<{ url: string; close: () => Promise<void> }> {
  return new Promise((resolve) => {
    const server = http.createServer(handler);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as AddressInfo;
      const url = `http://127.0.0.1:${port}`;
      const close = () =>
        new Promise<void>((res, rej) => server.close((err) => (err ? rej(err) : res())));
      resolve({ url, close });
    });
  });
}

/**
 * Create an SSE-formatted response payload.
 */
function sseChunks(tokens: string[]): string {
  const chunks = tokens.map(
    (t) => `data: ${JSON.stringify({ choices: [{ delta: { content: t } }] })}\n\n`,
  );
  chunks.push('data: [DONE]\n\n');
  return chunks.join('');
}

// ============================================================================
// Test config — fast retries so tests don't take forever
// ============================================================================

const fastConfig: Partial<HttpClientConfig> = {
  maxRetries: 3,
  baseDelayMs: 10,
  maxDelayMs: 100,
  backoffMultiplier: 2,
  timeoutMs: 2000,
};

// ============================================================================
// describe HttpClient
// ============================================================================

describe('HttpClient', () => {
  // --------------------------------------------------------------------------
  // GET success
  // --------------------------------------------------------------------------

  it('get() returns ok:true with data and attempts:1 on 200', async () => {
    const payload = { hello: 'world' };
    const { url, close } = await makeServer((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(payload));
    });

    try {
      const client = new HttpClient(fastConfig);
      const result = await client.get<typeof payload>(url + '/test');
      expect(result.ok).toBe(true);
      expect(result.data).toEqual(payload);
      expect(result.attempts).toBe(1);
      expect(result.totalLatencyMs).toBeGreaterThanOrEqual(0);
    } finally {
      await close();
    }
  });

  // --------------------------------------------------------------------------
  // POST success
  // --------------------------------------------------------------------------

  it('post() returns ok:true with data and attempts:1 on 200', async () => {
    const payload = { result: 'ok' };
    let receivedBody = '';

    const { url, close } = await makeServer((req, res) => {
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', () => {
        receivedBody = body;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(payload));
      });
    });

    try {
      const client = new HttpClient(fastConfig);
      const result = await client.post<typeof payload>(url + '/test', { input: 'data' });
      expect(result.ok).toBe(true);
      expect(result.data).toEqual(payload);
      expect(result.attempts).toBe(1);
      expect(receivedBody).toContain('input');
    } finally {
      await close();
    }
  });

  // --------------------------------------------------------------------------
  // Retry on 503 then success
  // --------------------------------------------------------------------------

  it('post() retries on 503 then succeeds, attempts:2', async () => {
    let callCount = 0;
    const payload = { recovered: true };

    const { url, close } = await makeServer((_req, res) => {
      callCount++;
      if (callCount === 1) {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Service Unavailable' }));
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(payload));
      }
    });

    try {
      const client = new HttpClient(fastConfig);
      const result = await client.post<typeof payload>(url + '/test', {});
      expect(result.ok).toBe(true);
      expect(result.data).toEqual(payload);
      expect(result.attempts).toBe(2);
      expect(callCount).toBe(2);
    } finally {
      await close();
    }
  });

  // --------------------------------------------------------------------------
  // NO retry on 400
  // --------------------------------------------------------------------------

  it('post() does NOT retry on 400, returns errorCategory:model', async () => {
    let callCount = 0;

    const { url, close } = await makeServer((_req, res) => {
      callCount++;
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Bad Request' }));
    });

    try {
      const client = new HttpClient(fastConfig);
      const result = await client.post(url + '/test', {});
      expect(result.ok).toBe(false);
      expect(result.errorCategory).toBe('model');
      expect(result.status).toBe(400);
      expect(callCount).toBe(1); // no retry
    } finally {
      await close();
    }
  });

  // --------------------------------------------------------------------------
  // NO retry on 404
  // --------------------------------------------------------------------------

  it('post() does NOT retry on 404, returns errorCategory:model', async () => {
    let callCount = 0;

    const { url, close } = await makeServer((_req, res) => {
      callCount++;
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not Found' }));
    });

    try {
      const client = new HttpClient(fastConfig);
      const result = await client.post(url + '/test', {});
      expect(result.ok).toBe(false);
      expect(result.errorCategory).toBe('model');
      expect(result.status).toBe(404);
      expect(callCount).toBe(1);
    } finally {
      await close();
    }
  });

  // --------------------------------------------------------------------------
  // Retry on 429 — rate-limit
  // --------------------------------------------------------------------------

  it('post() retries on 429 and returns errorCategory:rate-limit after exhausting retries', async () => {
    let callCount = 0;

    const { url, close } = await makeServer((_req, res) => {
      callCount++;
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Too Many Requests' }));
    });

    try {
      const client = new HttpClient({ ...fastConfig, maxRetries: 2 });
      const result = await client.post(url + '/test', {});
      expect(result.ok).toBe(false);
      expect(result.errorCategory).toBe('rate-limit');
      expect(callCount).toBeGreaterThan(1); // retried
    } finally {
      await close();
    }
  });

  // --------------------------------------------------------------------------
  // Network error — unreachable endpoint
  // --------------------------------------------------------------------------

  it('post() returns errorCategory:network on unreachable endpoint after max retries', async () => {
    const client = new HttpClient({ ...fastConfig, maxRetries: 2 });
    // Port 1 is not bindable and will refuse connections
    const result = await client.post('http://127.0.0.1:1/test', {});
    expect(result.ok).toBe(false);
    expect(result.errorCategory).toBe('network');
    expect(result.attempts).toBeGreaterThan(1); // retried
  });

  // --------------------------------------------------------------------------
  // Timeout — AbortController fires
  // --------------------------------------------------------------------------

  it('post() returns errorCategory:timeout when server is too slow', async () => {
    const { url, close } = await makeServer((_req, _res) => {
      // Never respond — hangs indefinitely
    });

    try {
      const client = new HttpClient({ ...fastConfig, timeoutMs: 50, maxRetries: 1 });
      const result = await client.post(url + '/test', {});
      expect(result.ok).toBe(false);
      expect(result.errorCategory).toBe('timeout');
    } finally {
      await close();
    }
  });

  // --------------------------------------------------------------------------
  // SSE streaming
  // --------------------------------------------------------------------------

  it('stream() with SSE mock returns aggregated content', async () => {
    const tokens = ['Hello', ', ', 'world', '!'];

    const { url, close } = await makeServer((_req, res) => {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });
      res.write(sseChunks(tokens));
      res.end();
    });

    try {
      const client = new HttpClient(fastConfig);
      const received: string[] = [];
      const result = await client.stream(url + '/stream', {}, {}, (token) => {
        received.push(token);
      });
      expect(result.ok).toBe(true);
      expect(received).toEqual(tokens);
      expect(result.data?.content).toBe(tokens.join(''));
    } finally {
      await close();
    }
  });

  // --------------------------------------------------------------------------
  // Connection: keep-alive header
  // --------------------------------------------------------------------------

  it('sends Connection: keep-alive header on all requests', async () => {
    const capturedHeaders: Record<string, string>[] = [];

    const { url, close } = await makeServer((req, res) => {
      capturedHeaders.push(req.headers as Record<string, string>);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({}));
    });

    try {
      const client = new HttpClient(fastConfig);
      await client.get(url + '/a');
      await client.post(url + '/b', {});
      expect(capturedHeaders).toHaveLength(2);
      for (const headers of capturedHeaders) {
        expect(headers['connection']?.toLowerCase()).toBe('keep-alive');
      }
    } finally {
      await close();
    }
  });

  // --------------------------------------------------------------------------
  // Backoff delay increases exponentially
  // --------------------------------------------------------------------------

  it('retry delays increase exponentially', async () => {
    const delays: number[] = [];
    let lastCallTime = Date.now();
    let callCount = 0;

    const { url, close } = await makeServer((_req, res) => {
      callCount++;
      const now = Date.now();
      if (callCount > 1) {
        delays.push(now - lastCallTime);
      }
      lastCallTime = now;
      res.writeHead(503);
      res.end();
    });

    try {
      // Use larger delays to make timing measurable
      const client = new HttpClient({
        maxRetries: 3,
        baseDelayMs: 50,
        maxDelayMs: 2000,
        backoffMultiplier: 2,
        timeoutMs: 5000,
      });
      await client.post(url + '/test', {});
      expect(delays).toHaveLength(3);
      // Each delay should be >= previous (exponential growth)
      // Allow for jitter by checking delay[1] > delay[0] * 0.5
      if (delays.length >= 2) {
        expect(delays[1]!).toBeGreaterThan(delays[0]! * 0.5);
      }
    } finally {
      await close();
    }
  });
});

// ============================================================================
// describe classifyError
// ============================================================================

describe('classifyError', () => {
  it('returns rate-limit for 429 responses', () => {
    expect(classifyError(new Error('429'), 429)).toBe('rate-limit');
  });

  it('returns model for 4xx responses (400, 401, 403, 404, 422)', () => {
    for (const status of [400, 401, 403, 404, 422]) {
      expect(classifyError(new Error('client error'), status)).toBe('model');
    }
  });

  it('returns network for 5xx responses', () => {
    expect(classifyError(new Error('server error'), 500)).toBe('network');
    expect(classifyError(new Error('server error'), 503)).toBe('network');
  });

  it('returns timeout for AbortError', () => {
    const abortErr = new DOMException('signal timed out', 'AbortError');
    expect(classifyError(abortErr)).toBe('timeout');
  });

  it('returns network for connection-level errors', () => {
    expect(classifyError(new Error('ECONNREFUSED'))).toBe('network');
    expect(classifyError(new Error('fetch failed'))).toBe('network');
  });
});

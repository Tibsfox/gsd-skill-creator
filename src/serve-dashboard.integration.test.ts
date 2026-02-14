/**
 * Integration tests for helper endpoint wiring in serve-dashboard.
 *
 * These tests create a minimal HTTP server that mirrors serve-dashboard.mjs's
 * handler flow (SSE, /api/check, /api/regenerate, helper router passthrough,
 * then static files) to prove the integration pattern works end-to-end.
 *
 * The tests verify:
 * - POST /api/console/message writes files via helper router
 * - Path traversal is rejected with 403
 * - Existing routes (SSE, /api/check) continue working
 * - Config subdirectory writes work
 *
 * @module serve-dashboard.integration.test
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer, type Server, type IncomingMessage, type ServerResponse } from 'node:http';
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHelperRouter, type HelperRouter } from './console/helper.js';
import { ensureConsoleDirectory } from './console/directory.js';

// ---------------------------------------------------------------------------
// Test server -- minimal reproduction of serve-dashboard.mjs handler flow
// ---------------------------------------------------------------------------

/** SSE clients for the test server. */
const sseClients = new Set<ServerResponse>();

function createTestServer(helperRouter: HelperRouter | null): Server {
  return createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url ?? '/', `http://localhost`);
    const pathname = url.pathname;

    // API: SSE endpoint (same as serve-dashboard.mjs)
    if (pathname === '/api/events') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });
      res.write('data: connected\n\n');
      sseClients.add(res);
      req.on('close', () => sseClients.delete(res));
      return;
    }

    // API: check endpoint (same as serve-dashboard.mjs)
    if (pathname === '/api/check') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ generatedAt: null, ok: true }));
      return;
    }

    // API: regenerate endpoint (same as serve-dashboard.mjs)
    if (pathname === '/api/regenerate' && req.method === 'POST') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, message: 'Regeneration queued' }));
      return;
    }

    // API: console helper endpoint (browser -> filesystem bridge)
    // This is the integration point we are testing
    if (helperRouter) {
      const handled = await helperRouter.handleRequest(req, res);
      if (handled) return;
    }

    // Static file serving fallback (simplified for tests)
    res.writeHead(404);
    res.end('Not Found');
  });
}

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

describe('serve-dashboard helper endpoint integration', () => {
  let tmpDir: string;
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    // Create temp directory with console structure
    tmpDir = mkdtempSync(join(tmpdir(), 'serve-dashboard-integration-'));
    await ensureConsoleDirectory(tmpDir);

    // Create helper router and test server
    const helperRouter = createHelperRouter(tmpDir);
    server = createTestServer(helperRouter);

    // Start on random port
    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const addr = server.address();
        if (addr && typeof addr === 'object') {
          baseUrl = `http://localhost:${addr.port}`;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    // Close all SSE connections
    for (const client of sseClients) {
      client.end();
    }
    sseClients.clear();

    // Shut down server
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });

    // Clean up temp directory
    rmSync(tmpDir, { recursive: true, force: true });
  });

  // -------------------------------------------------------------------------
  // 1. POST /api/console/message with valid body
  // -------------------------------------------------------------------------
  it('writes a JSON file to inbox/pending via POST /api/console/message', async () => {
    const response = await fetch(`${baseUrl}/api/console/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: 'integration-test-msg.json',
        content: { type: 'config-update', data: { theme: 'dark' } },
        subdirectory: 'inbox/pending',
      }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.path).toContain('inbox/pending/integration-test-msg.json');

    // Verify file exists on disk
    const filePath = join(tmpDir, '.planning/console/inbox/pending/integration-test-msg.json');
    expect(existsSync(filePath)).toBe(true);

    const written = JSON.parse(readFileSync(filePath, 'utf-8'));
    expect(written.type).toBe('config-update');
    expect(written.data.theme).toBe('dark');
  });

  // -------------------------------------------------------------------------
  // 2. POST /api/console/message with path traversal
  // -------------------------------------------------------------------------
  it('rejects path traversal attempts with 403', async () => {
    const response = await fetch(`${baseUrl}/api/console/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: '../../../etc/passwd',
        content: { hack: true },
        subdirectory: 'inbox/pending',
      }),
    });

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBe('Path traversal rejected');
  });

  // -------------------------------------------------------------------------
  // 3. GET /api/check still returns 200 with JSON
  // -------------------------------------------------------------------------
  it('preserves GET /api/check route (returns 200 with JSON)', async () => {
    const response = await fetch(`${baseUrl}/api/check`);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect('generatedAt' in body).toBe(true);
  });

  // -------------------------------------------------------------------------
  // 4. GET /api/events returns SSE content-type
  // -------------------------------------------------------------------------
  it('preserves GET /api/events SSE route (text/event-stream)', async () => {
    const controller = new AbortController();
    const response = await fetch(`${baseUrl}/api/events`, {
      signal: controller.signal,
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/event-stream');

    // Abort to close the SSE connection
    controller.abort();
  });

  // -------------------------------------------------------------------------
  // 5. POST /api/console/message with config subdirectory
  // -------------------------------------------------------------------------
  it('writes to config subdirectory via helper endpoint', async () => {
    const response = await fetch(`${baseUrl}/api/console/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: 'settings-update.json',
        content: { type: 'config-update', hot: true, settings: { theme: 'light' } },
        subdirectory: 'config',
      }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.path).toContain('config/settings-update.json');

    // Verify file exists on disk
    const filePath = join(tmpDir, '.planning/console/config/settings-update.json');
    expect(existsSync(filePath)).toBe(true);
  });

  // -------------------------------------------------------------------------
  // 6. Non-matching routes fall through to 404
  // -------------------------------------------------------------------------
  it('falls through to 404 for unknown routes', async () => {
    const response = await fetch(`${baseUrl}/nonexistent`);

    expect(response.status).toBe(404);
  });

  // -------------------------------------------------------------------------
  // 7. Helper router passes through non-matching API routes
  // -------------------------------------------------------------------------
  it('helper router passes through for non-matching API paths', async () => {
    const response = await fetch(`${baseUrl}/api/unknown-endpoint`);

    expect(response.status).toBe(404);
  });
});

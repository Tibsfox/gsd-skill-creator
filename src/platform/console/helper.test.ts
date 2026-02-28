/**
 * Tests for console helper endpoint -- HTTP bridge for browser filesystem writes.
 *
 * Tests use mock request/response objects for speed and temp directories
 * for filesystem isolation. Each test gets a fresh temp directory.
 *
 * @module console/helper.test
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { IncomingMessage, ServerResponse } from 'node:http';
import { Socket } from 'node:net';
import { createHelperRouter } from './helper.js';
import { ensureConsoleDirectory } from './directory.js';

// ---------------------------------------------------------------------------
// Mock helpers -- lightweight IncomingMessage/ServerResponse fakes
// ---------------------------------------------------------------------------

interface MockResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
  writeHead: (code: number, headers?: Record<string, string>) => MockResponse;
  setHeader: (name: string, value: string) => void;
  end: (data?: string) => void;
}

function createMockReq(
  method: string,
  url: string,
  body?: string,
): IncomingMessage {
  const socket = new Socket();
  const req = new IncomingMessage(socket);
  req.method = method;
  req.url = url;
  req.headers = { 'content-type': 'application/json' };

  // Simulate readable stream with body data
  if (body !== undefined) {
    process.nextTick(() => {
      req.push(body);
      req.push(null);
    });
  } else {
    process.nextTick(() => {
      req.push(null);
    });
  }

  return req;
}

function createMockRes(): MockResponse {
  const res: MockResponse = {
    statusCode: 200,
    headers: {},
    body: '',
    writeHead(code: number, headers?: Record<string, string>) {
      res.statusCode = code;
      if (headers) {
        Object.assign(res.headers, headers);
      }
      return res;
    },
    setHeader(name: string, value: string) {
      res.headers[name.toLowerCase()] = value;
    },
    end(data?: string) {
      if (data) res.body = data;
    },
  };
  return res;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('createHelperRouter', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = mkdtempSync(join(tmpdir(), 'helper-test-'));
    await ensureConsoleDirectory(tmpDir);
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  // -----------------------------------------------------------------------
  // 1. Valid write
  // -----------------------------------------------------------------------
  it('writes a valid message to inbox/pending and returns 200', async () => {
    const router = createHelperRouter(tmpDir);
    const body = JSON.stringify({
      filename: 'test-message.json',
      content: { type: 'milestone-submit', data: { name: 'v2.0' } },
      subdirectory: 'inbox/pending',
    });
    const req = createMockReq('POST', '/api/console/message', body);
    const res = createMockRes();

    await router.handleRequest(req, res as unknown as ServerResponse);

    expect(res.statusCode).toBe(200);
    const parsed = JSON.parse(res.body);
    expect(parsed.ok).toBe(true);
    expect(parsed.path).toContain('inbox/pending/test-message.json');

    // Verify file actually exists on disk
    const filePath = join(tmpDir, '.planning/console/inbox/pending/test-message.json');
    expect(existsSync(filePath)).toBe(true);

    const written = JSON.parse(readFileSync(filePath, 'utf-8'));
    expect(written.type).toBe('milestone-submit');
    expect(written.data.name).toBe('v2.0');
  });

  // -----------------------------------------------------------------------
  // 2. Path traversal -- dot-dot in filename
  // -----------------------------------------------------------------------
  it('rejects path traversal with ../ in filename with 403', async () => {
    const router = createHelperRouter(tmpDir);
    const body = JSON.stringify({
      filename: '../../../etc/passwd',
      content: { hack: true },
      subdirectory: 'inbox/pending',
    });
    const req = createMockReq('POST', '/api/console/message', body);
    const res = createMockRes();

    await router.handleRequest(req, res as unknown as ServerResponse);

    expect(res.statusCode).toBe(403);
    const parsed = JSON.parse(res.body);
    expect(parsed.error).toBe('Path traversal rejected');

    // Verify no file was written anywhere outside console directory
    expect(existsSync('/etc/passwd.json')).toBe(false);
  });

  // -----------------------------------------------------------------------
  // 3. Path traversal -- absolute path in filename
  // -----------------------------------------------------------------------
  it('rejects absolute path in filename with 403', async () => {
    const router = createHelperRouter(tmpDir);
    const body = JSON.stringify({
      filename: '/etc/passwd',
      content: { hack: true },
      subdirectory: 'inbox/pending',
    });
    const req = createMockReq('POST', '/api/console/message', body);
    const res = createMockRes();

    await router.handleRequest(req, res as unknown as ServerResponse);

    expect(res.statusCode).toBe(403);
    const parsed = JSON.parse(res.body);
    expect(parsed.error).toBe('Path traversal rejected');
  });

  // -----------------------------------------------------------------------
  // 4. Path traversal -- URL-encoded dots
  // -----------------------------------------------------------------------
  it('rejects URL-encoded path traversal with 403', async () => {
    const router = createHelperRouter(tmpDir);
    const body = JSON.stringify({
      filename: '..%2F..%2Fetc/passwd',
      content: { hack: true },
      subdirectory: 'inbox/pending',
    });
    const req = createMockReq('POST', '/api/console/message', body);
    const res = createMockRes();

    await router.handleRequest(req, res as unknown as ServerResponse);

    expect(res.statusCode).toBe(403);
    const parsed = JSON.parse(res.body);
    expect(parsed.error).toBe('Path traversal rejected');
  });

  // -----------------------------------------------------------------------
  // 5. Path traversal in subdirectory
  // -----------------------------------------------------------------------
  it('rejects path traversal in subdirectory with 403', async () => {
    const router = createHelperRouter(tmpDir);
    const body = JSON.stringify({
      filename: 'test.json',
      content: { hack: true },
      subdirectory: '../../outside',
    });
    const req = createMockReq('POST', '/api/console/message', body);
    const res = createMockRes();

    await router.handleRequest(req, res as unknown as ServerResponse);

    expect(res.statusCode).toBe(403);
    const parsed = JSON.parse(res.body);
    expect(parsed.error).toMatch(/path traversal|not allowed/i);
  });

  // -----------------------------------------------------------------------
  // 6. Invalid JSON body
  // -----------------------------------------------------------------------
  it('returns 400 for invalid JSON body', async () => {
    const router = createHelperRouter(tmpDir);
    const req = createMockReq('POST', '/api/console/message', 'not valid json{{{');
    const res = createMockRes();

    await router.handleRequest(req, res as unknown as ServerResponse);

    expect(res.statusCode).toBe(400);
    const parsed = JSON.parse(res.body);
    expect(parsed.error).toBe('Invalid JSON');
  });

  // -----------------------------------------------------------------------
  // 7. Missing filename
  // -----------------------------------------------------------------------
  it('returns 400 when filename is missing', async () => {
    const router = createHelperRouter(tmpDir);
    const body = JSON.stringify({
      content: { data: 'value' },
      subdirectory: 'inbox/pending',
    });
    const req = createMockReq('POST', '/api/console/message', body);
    const res = createMockRes();

    await router.handleRequest(req, res as unknown as ServerResponse);

    expect(res.statusCode).toBe(400);
    const parsed = JSON.parse(res.body);
    expect(parsed.error).toMatch(/filename/i);
  });

  // -----------------------------------------------------------------------
  // 8. Missing content
  // -----------------------------------------------------------------------
  it('returns 400 when content is missing', async () => {
    const router = createHelperRouter(tmpDir);
    const body = JSON.stringify({
      filename: 'test.json',
      subdirectory: 'inbox/pending',
    });
    const req = createMockReq('POST', '/api/console/message', body);
    const res = createMockRes();

    await router.handleRequest(req, res as unknown as ServerResponse);

    expect(res.statusCode).toBe(400);
    const parsed = JSON.parse(res.body);
    expect(parsed.error).toMatch(/content/i);
  });

  // -----------------------------------------------------------------------
  // 9. Non-POST method
  // -----------------------------------------------------------------------
  it('returns 405 for GET requests', async () => {
    const router = createHelperRouter(tmpDir);
    const req = createMockReq('GET', '/api/console/message');
    const res = createMockRes();

    await router.handleRequest(req, res as unknown as ServerResponse);

    expect(res.statusCode).toBe(405);
    const parsed = JSON.parse(res.body);
    expect(parsed.error).toMatch(/method/i);
  });

  // -----------------------------------------------------------------------
  // 10. Subdirectory validation -- only allowed dirs
  // -----------------------------------------------------------------------
  it('rejects arbitrary subdirectory with 403', async () => {
    const router = createHelperRouter(tmpDir);
    const body = JSON.stringify({
      filename: 'test.json',
      content: { data: 'value' },
      subdirectory: 'some/random/path',
    });
    const req = createMockReq('POST', '/api/console/message', body);
    const res = createMockRes();

    await router.handleRequest(req, res as unknown as ServerResponse);

    expect(res.statusCode).toBe(403);
    const parsed = JSON.parse(res.body);
    expect(parsed.error).toMatch(/subdirectory not allowed/i);
  });

  // -----------------------------------------------------------------------
  // 11. Default subdirectory -- inbox/pending when omitted
  // -----------------------------------------------------------------------
  it('defaults to inbox/pending when subdirectory is omitted', async () => {
    const router = createHelperRouter(tmpDir);
    const body = JSON.stringify({
      filename: 'default-test.json',
      content: { defaulted: true },
    });
    const req = createMockReq('POST', '/api/console/message', body);
    const res = createMockRes();

    await router.handleRequest(req, res as unknown as ServerResponse);

    expect(res.statusCode).toBe(200);
    const filePath = join(tmpDir, '.planning/console/inbox/pending/default-test.json');
    expect(existsSync(filePath)).toBe(true);
  });

  // -----------------------------------------------------------------------
  // 12. Config subdirectory works
  // -----------------------------------------------------------------------
  it('allows writing to config subdirectory', async () => {
    const router = createHelperRouter(tmpDir);
    const body = JSON.stringify({
      filename: 'settings.json',
      content: { theme: 'dark' },
      subdirectory: 'config',
    });
    const req = createMockReq('POST', '/api/console/message', body);
    const res = createMockRes();

    await router.handleRequest(req, res as unknown as ServerResponse);

    expect(res.statusCode).toBe(200);
    const filePath = join(tmpDir, '.planning/console/config/settings.json');
    expect(existsSync(filePath)).toBe(true);
  });

  // -----------------------------------------------------------------------
  // 13. Uploads subdirectory works
  // -----------------------------------------------------------------------
  it('allows writing to uploads subdirectory', async () => {
    const router = createHelperRouter(tmpDir);
    const body = JSON.stringify({
      filename: 'vision-doc.json',
      content: { document: 'requirements' },
      subdirectory: 'uploads',
    });
    const req = createMockReq('POST', '/api/console/message', body);
    const res = createMockRes();

    await router.handleRequest(req, res as unknown as ServerResponse);

    expect(res.statusCode).toBe(200);
    const filePath = join(tmpDir, '.planning/console/uploads/vision-doc.json');
    expect(existsSync(filePath)).toBe(true);
  });

  // -----------------------------------------------------------------------
  // 14. CORS headers are set
  // -----------------------------------------------------------------------
  it('sets CORS headers on response', async () => {
    const router = createHelperRouter(tmpDir);
    const body = JSON.stringify({
      filename: 'cors-test.json',
      content: { test: true },
    });
    const req = createMockReq('POST', '/api/console/message', body);
    const res = createMockRes();

    await router.handleRequest(req, res as unknown as ServerResponse);

    expect(res.headers['access-control-allow-origin']).toBe('*');
  });

  // -----------------------------------------------------------------------
  // 15. Non-matching path returns false (passthrough)
  // -----------------------------------------------------------------------
  it('returns false for non-matching paths', async () => {
    const router = createHelperRouter(tmpDir);
    const req = createMockReq('GET', '/api/check');
    const res = createMockRes();

    const handled = await router.handleRequest(req, res as unknown as ServerResponse);

    expect(handled).toBe(false);
  });
});

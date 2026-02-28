/**
 * Tests for the JSONL bridge logger -- audit trail for browser-to-filesystem writes.
 *
 * Each test gets a fresh temp directory. The bridge logger appends one JSON line
 * per operation to console/logs/bridge.jsonl.
 *
 * @module console/bridge-logger.test
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdir, rm } from 'node:fs/promises';
import { IncomingMessage, ServerResponse } from 'node:http';
import { Socket } from 'node:net';
import { BridgeLogger, BridgeLogEntry } from './bridge-logger.js';
import { ensureConsoleDirectory } from './directory.js';
import { createHelperRouter } from './helper.js';
import { CONSOLE_DIRS } from './types.js';

// ---------------------------------------------------------------------------
// Mock helpers (shared with helper.test.ts pattern)
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
// Helper to read bridge.jsonl and parse all entries
// ---------------------------------------------------------------------------

function readLogEntries(basePath: string): BridgeLogEntry[] {
  const logPath = join(basePath, CONSOLE_DIRS.logs, 'bridge.jsonl');
  if (!existsSync(logPath)) return [];
  const content = readFileSync(logPath, 'utf-8').trim();
  if (!content) return [];
  return content.split('\n').map((line) => JSON.parse(line) as BridgeLogEntry);
}

// ---------------------------------------------------------------------------
// BridgeLogger unit tests
// ---------------------------------------------------------------------------

describe('BridgeLogger', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = mkdtempSync(join(tmpdir(), 'bridge-logger-test-'));
    await ensureConsoleDirectory(tmpDir);
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  // -----------------------------------------------------------------------
  // 1. Log success entry
  // -----------------------------------------------------------------------
  it('logs a success entry to bridge.jsonl', async () => {
    const logger = new BridgeLogger(tmpDir);
    const entry: BridgeLogEntry = {
      timestamp: new Date().toISOString(),
      filename: 'test-message.json',
      subdirectory: 'inbox/pending',
      contentSize: 42,
      status: 'success',
    };

    await logger.log(entry);

    const entries = readLogEntries(tmpDir);
    expect(entries).toHaveLength(1);
    expect(entries[0].filename).toBe('test-message.json');
    expect(entries[0].subdirectory).toBe('inbox/pending');
    expect(entries[0].contentSize).toBe(42);
    expect(entries[0].status).toBe('success');
  });

  // -----------------------------------------------------------------------
  // 2. Log error entry
  // -----------------------------------------------------------------------
  it('logs an error entry with error reason', async () => {
    const logger = new BridgeLogger(tmpDir);
    const entry: BridgeLogEntry = {
      timestamp: new Date().toISOString(),
      filename: '../../../etc/passwd',
      subdirectory: 'inbox/pending',
      contentSize: 0,
      status: 'error',
      error: 'Path traversal rejected',
    };

    await logger.log(entry);

    const entries = readLogEntries(tmpDir);
    expect(entries).toHaveLength(1);
    expect(entries[0].status).toBe('error');
    expect(entries[0].error).toBe('Path traversal rejected');
  });

  // -----------------------------------------------------------------------
  // 3. Append multiple entries (JSONL format)
  // -----------------------------------------------------------------------
  it('appends multiple entries as separate JSONL lines', async () => {
    const logger = new BridgeLogger(tmpDir);

    for (let i = 0; i < 3; i++) {
      await logger.log({
        timestamp: new Date().toISOString(),
        filename: `message-${i}.json`,
        subdirectory: 'inbox/pending',
        contentSize: 10 * (i + 1),
        status: 'success',
      });
    }

    const entries = readLogEntries(tmpDir);
    expect(entries).toHaveLength(3);
    expect(entries[0].filename).toBe('message-0.json');
    expect(entries[1].filename).toBe('message-1.json');
    expect(entries[2].filename).toBe('message-2.json');
  });

  // -----------------------------------------------------------------------
  // 4. Creates logs directory if missing
  // -----------------------------------------------------------------------
  it('creates logs directory if missing', async () => {
    // Remove the logs directory that ensureConsoleDirectory created
    const logsDir = join(tmpDir, CONSOLE_DIRS.logs);
    await rm(logsDir, { recursive: true, force: true });
    expect(existsSync(logsDir)).toBe(false);

    const logger = new BridgeLogger(tmpDir);
    await logger.log({
      timestamp: new Date().toISOString(),
      filename: 'after-rm.json',
      subdirectory: 'inbox/pending',
      contentSize: 5,
      status: 'success',
    });

    expect(existsSync(logsDir)).toBe(true);
    const entries = readLogEntries(tmpDir);
    expect(entries).toHaveLength(1);
  });

  // -----------------------------------------------------------------------
  // 5. Creates bridge.jsonl file if not exists
  // -----------------------------------------------------------------------
  it('creates bridge.jsonl file if not exists', async () => {
    const logPath = join(tmpDir, CONSOLE_DIRS.logs, 'bridge.jsonl');
    expect(existsSync(logPath)).toBe(false);

    const logger = new BridgeLogger(tmpDir);
    await logger.log({
      timestamp: new Date().toISOString(),
      filename: 'new-file.json',
      subdirectory: 'config',
      contentSize: 20,
      status: 'success',
    });

    expect(existsSync(logPath)).toBe(true);
  });

  // -----------------------------------------------------------------------
  // 6. Concurrent writes preserve all entries
  // -----------------------------------------------------------------------
  it('preserves all entries during concurrent writes', async () => {
    const logger = new BridgeLogger(tmpDir);

    const promises = Array.from({ length: 5 }, (_, i) =>
      logger.log({
        timestamp: new Date().toISOString(),
        filename: `concurrent-${i}.json`,
        subdirectory: 'uploads',
        contentSize: 100 + i,
        status: 'success',
      }),
    );

    await Promise.all(promises);

    const entries = readLogEntries(tmpDir);
    expect(entries).toHaveLength(5);
    // All entries should be present (order may vary with concurrent writes)
    const filenames = entries.map((e) => e.filename).sort();
    expect(filenames).toEqual([
      'concurrent-0.json',
      'concurrent-1.json',
      'concurrent-2.json',
      'concurrent-3.json',
      'concurrent-4.json',
    ]);
  });

  // -----------------------------------------------------------------------
  // 7. Entry has ISO 8601 timestamp
  // -----------------------------------------------------------------------
  it('entry has valid ISO 8601 timestamp', async () => {
    const logger = new BridgeLogger(tmpDir);
    const now = new Date().toISOString();

    await logger.log({
      timestamp: now,
      filename: 'ts-test.json',
      subdirectory: 'inbox/pending',
      contentSize: 15,
      status: 'success',
    });

    const entries = readLogEntries(tmpDir);
    expect(entries).toHaveLength(1);
    // ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
    expect(entries[0].timestamp).toMatch(isoRegex);
    // Verify it parses back to a valid date
    expect(new Date(entries[0].timestamp).toISOString()).toBe(now);
  });
});

// ---------------------------------------------------------------------------
// Helper integration tests -- verify logger is called by the endpoint
// ---------------------------------------------------------------------------

describe('Helper endpoint bridge logging integration', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = mkdtempSync(join(tmpdir(), 'bridge-integration-test-'));
    await ensureConsoleDirectory(tmpDir);
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  // -----------------------------------------------------------------------
  // 8. Helper calls logger on successful write
  // -----------------------------------------------------------------------
  it('logs a success entry after a valid helper write', async () => {
    const router = createHelperRouter(tmpDir);
    const body = JSON.stringify({
      filename: 'log-test.json',
      content: { data: 'value' },
      subdirectory: 'inbox/pending',
    });
    const req = createMockReq('POST', '/api/console/message', body);
    const res = createMockRes();

    await router.handleRequest(req, res as unknown as ServerResponse);

    expect(res.statusCode).toBe(200);

    const entries = readLogEntries(tmpDir);
    expect(entries).toHaveLength(1);
    expect(entries[0].status).toBe('success');
    expect(entries[0].filename).toBe('log-test.json');
    expect(entries[0].subdirectory).toBe('inbox/pending');
    expect(entries[0].contentSize).toBeGreaterThan(0);
  });

  // -----------------------------------------------------------------------
  // 9. Helper calls logger on path traversal rejection
  // -----------------------------------------------------------------------
  it('logs an error entry on path traversal rejection', async () => {
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

    const entries = readLogEntries(tmpDir);
    expect(entries).toHaveLength(1);
    expect(entries[0].status).toBe('error');
    expect(entries[0].error).toBe('Path traversal rejected');
    expect(entries[0].filename).toBe('../../../etc/passwd');
  });
});

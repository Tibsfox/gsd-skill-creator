/**
 * Tests for single-package fetcher with mirror fallback.
 *
 * Mocks globalThis.fetch to simulate mirror responses and verifies:
 * - Successful .lha download to correct directory hierarchy
 * - Mirror fallback on failure
 * - All-mirrors-fail error aggregation
 * - User-Agent header inclusion
 * - AbortController timeout
 * - Mirror URL construction (no hardcoded /aminet/ prefix)
 * - .readme success and non-fatal failure
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { fetchPackage } from './package-fetcher.js';
import type { AminetPackage, DownloadConfig } from './types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const originalFetch = globalThis.fetch;

/** Mock AminetPackage fixture */
const PKG: AminetPackage = {
  filename: 'Tool.lha',
  directory: 'util/misc',
  category: 'util',
  subcategory: 'misc',
  sizeKb: 12,
  ageDays: 100,
  description: 'A test tool',
  fullPath: 'util/misc/Tool.lha',
};

/** Create a test DownloadConfig pointing at a temp directory */
function makeConfig(overrides?: Partial<DownloadConfig>): DownloadConfig {
  return {
    mirrors: ['https://aminet.net'],
    userAgent: 'GSD-Aminet-Pack/1.0',
    timeoutMs: 5000,
    cacheDir: '/tmp/unused',
    delayMs: 0,
    concurrency: 1,
    mirrorDir: tempDir,
    ...overrides,
  };
}

/** Fake .lha content */
const LHA_BODY = Buffer.from('fake-lha-archive-content');

/** Fake .readme content */
const README_BODY = Buffer.from('Short: A test tool\n\nThis is a test readme.');

/** Build a mock Response */
function mockResponse(
  status: number,
  body?: Buffer,
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: new Headers(),
    redirected: false,
    type: 'basic' as ResponseType,
    url: '',
    body: null,
    bodyUsed: false,
    clone: () => mockResponse(status, body),
    arrayBuffer: async () =>
      body
        ? body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength)
        : new ArrayBuffer(0),
    blob: async () => new Blob(),
    formData: async () => new FormData(),
    json: async () => ({}),
    text: async () => body?.toString() ?? '',
    bytes: async () => new Uint8Array(),
  } as Response;
}

// ---------------------------------------------------------------------------
// Test state
// ---------------------------------------------------------------------------

let tempDir: string;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'pkg-fetcher-'));
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  rmSync(tempDir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('fetchPackage', () => {
  it('downloads .lha successfully and returns FetchResult', async () => {
    globalThis.fetch = async () => mockResponse(200, LHA_BODY);

    const result = await fetchPackage(PKG, makeConfig());

    expect(result.lhaPath).toBe(join(tempDir, 'util/misc/Tool.lha'));
    expect(result.lhaData).toEqual(LHA_BODY);
    expect(existsSync(result.lhaPath)).toBe(true);
    expect(readFileSync(result.lhaPath)).toEqual(LHA_BODY);
  });

  it('creates directory hierarchy recursively', async () => {
    globalThis.fetch = async () => mockResponse(200, LHA_BODY);

    await fetchPackage(PKG, makeConfig());

    const dirPath = join(tempDir, 'util/misc');
    expect(existsSync(dirPath)).toBe(true);
  });

  it('falls back to second mirror when first fails', async () => {
    let callCount = 0;
    globalThis.fetch = async (input: RequestInfo | URL) => {
      callCount++;
      const url = typeof input === 'string' ? input : input.toString();
      if (url.startsWith('https://mirror1.example.com')) {
        return mockResponse(500);
      }
      return mockResponse(200, LHA_BODY);
    };

    const config = makeConfig({
      mirrors: ['https://mirror1.example.com', 'https://mirror2.example.com'],
    });
    const result = await fetchPackage(PKG, config);

    expect(result.lhaData).toEqual(LHA_BODY);
    expect(existsSync(result.lhaPath)).toBe(true);
    // Must have tried both mirrors (at least 2 .lha fetches)
    expect(callCount).toBeGreaterThanOrEqual(2);
  });

  it('throws with aggregate error when all mirrors fail', async () => {
    globalThis.fetch = async () => mockResponse(500);

    const config = makeConfig({
      mirrors: ['https://m1.example.com', 'https://m2.example.com'],
    });

    await expect(fetchPackage(PKG, config)).rejects.toThrow(/All 2 mirrors failed/);
  });

  it('sends User-Agent header from config', async () => {
    let capturedHeaders: HeadersInit | undefined;
    globalThis.fetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
      capturedHeaders = init?.headers;
      return mockResponse(200, LHA_BODY);
    };

    await fetchPackage(PKG, makeConfig({ userAgent: 'TestAgent/2.0' }));

    expect(capturedHeaders).toBeDefined();
    const headers =
      capturedHeaders instanceof Headers
        ? capturedHeaders
        : new Headers(capturedHeaders as Record<string, string>);
    expect(headers.get('User-Agent')).toBe('TestAgent/2.0');
  });

  it('uses AbortController with config.timeoutMs', async () => {
    let capturedSignal: AbortSignal | undefined;
    globalThis.fetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
      capturedSignal = init?.signal ?? undefined;
      return mockResponse(200, LHA_BODY);
    };

    await fetchPackage(PKG, makeConfig({ timeoutMs: 7000 }));

    expect(capturedSignal).toBeDefined();
    expect(capturedSignal).toBeInstanceOf(AbortSignal);
  });

  it('constructs mirror URL correctly without hardcoded /aminet/ prefix', async () => {
    const fetchedUrls: string[] = [];
    globalThis.fetch = async (input: RequestInfo | URL) => {
      fetchedUrls.push(typeof input === 'string' ? input : input.toString());
      return mockResponse(200, LHA_BODY);
    };

    // Test mirror without prefix
    await fetchPackage(PKG, makeConfig({ mirrors: ['https://aminet.net'] }));
    expect(fetchedUrls[0]).toBe('https://aminet.net/util/misc/Tool.lha');

    fetchedUrls.length = 0;

    // Test mirror with prefix already in URL
    await fetchPackage(
      PKG,
      makeConfig({ mirrors: ['http://de.aminet.net/aminet'] }),
    );
    expect(fetchedUrls[0]).toBe(
      'http://de.aminet.net/aminet/util/misc/Tool.lha',
    );
  });

  it('downloads .readme alongside .lha on success', async () => {
    globalThis.fetch = async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.endsWith('.readme')) {
        return mockResponse(200, README_BODY);
      }
      return mockResponse(200, LHA_BODY);
    };

    const result = await fetchPackage(PKG, makeConfig());

    expect(result.readmePath).toBe(join(tempDir, 'util/misc/Tool.readme'));
    expect(result.readmeData).toEqual(README_BODY);
    expect(existsSync(result.readmePath!)).toBe(true);
    expect(readFileSync(result.readmePath!)).toEqual(README_BODY);
  });

  it('succeeds when .readme fetch returns 404 (non-fatal)', async () => {
    globalThis.fetch = async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.endsWith('.readme')) {
        return mockResponse(404);
      }
      return mockResponse(200, LHA_BODY);
    };

    const result = await fetchPackage(PKG, makeConfig());

    expect(result.lhaData).toEqual(LHA_BODY);
    expect(result.lhaPath).toBe(join(tempDir, 'util/misc/Tool.lha'));
    expect(result.readmeData).toBeNull();
    expect(result.readmePath).toBeNull();
  });

  it('constructs .readme URL by replacing .lha extension', async () => {
    const fetchedUrls: string[] = [];
    globalThis.fetch = async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();
      fetchedUrls.push(url);
      return mockResponse(200, url.endsWith('.readme') ? README_BODY : LHA_BODY);
    };

    await fetchPackage(PKG, makeConfig());

    const readmeUrl = fetchedUrls.find((u) => u.endsWith('.readme'));
    expect(readmeUrl).toBe('https://aminet.net/util/misc/Tool.readme');
  });
});

/**
 * Tests for src/aminet/index-fetcher.ts
 *
 * All tests use local gzip buffers and mock HTTP -- no real network calls.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { gzipSync } from 'node:zlib';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { rmSync } from 'node:fs';

import {
  decompressIndex,
  decodeIndexContent,
  validateIndexFormat,
  isIndexStale,
  loadCachedIndex,
  fetchAminetIndex,
} from './index-fetcher.js';
import type { AminetMirrorConfig, IndexMetadata } from './types.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** Realistic INDEX header line (fixed-width columns as found in the real file). */
const VALID_HEADER =
  '| File                      | Dir        | Size | Age  | Description';

/** A minimal valid INDEX content. */
const VALID_INDEX = [
  VALID_HEADER,
  '| example.lha               | util/misc  |  12k | 365  | An example package',
  '| another.lha               | dev/c      |  45k | 100  | Another package',
].join('\n');

/** ISO-8859-1 test: bytes with accented characters. */
const LATIN1_BYTES = Buffer.from([
  0x52, 0x65, 0x6e, 0xe9, // "Ren" + e-acute
  0x20,                    // space
  0x42, 0x61, 0x72, 0x74, 0xf1, // "Bart" + n-tilde
]);

const LATIN1_EXPECTED = 'Ren\u00e9 Bart\u00f1';

// ---------------------------------------------------------------------------
// decompressIndex
// ---------------------------------------------------------------------------

describe('decompressIndex', () => {
  it('decompresses a gzip buffer to raw bytes', () => {
    const original = Buffer.from(VALID_INDEX, 'utf-8');
    const compressed = gzipSync(original);

    const result = decompressIndex(compressed);

    expect(result).toBeInstanceOf(Uint8Array);
    expect(Buffer.from(result).toString('utf-8')).toBe(VALID_INDEX);
  });

  it('throws on invalid gzip data', () => {
    expect(() => decompressIndex(Buffer.from('not gzip data'))).toThrow();
  });
});

// ---------------------------------------------------------------------------
// decodeIndexContent (ISO-8859-1)
// ---------------------------------------------------------------------------

describe('decodeIndexContent', () => {
  it('decodes ISO-8859-1 bytes preserving accented characters', () => {
    const decoded = decodeIndexContent(LATIN1_BYTES);
    expect(decoded).toBe(LATIN1_EXPECTED);
  });

  it('does not produce mojibake for high-byte characters', () => {
    // If decoded as UTF-8, byte 0xE9 alone is invalid and would produce
    // replacement characters. ISO-8859-1 maps it directly to U+00E9.
    const decoded = decodeIndexContent(LATIN1_BYTES);
    expect(decoded).not.toContain('\uFFFD'); // no replacement characters
    expect(decoded).toContain('\u00e9'); // e-acute present
    expect(decoded).toContain('\u00f1'); // n-tilde present
  });
});

// ---------------------------------------------------------------------------
// validateIndexFormat
// ---------------------------------------------------------------------------

describe('validateIndexFormat', () => {
  it('accepts valid INDEX content with proper header', () => {
    expect(() => validateIndexFormat(VALID_INDEX)).not.toThrow();
  });

  it('rejects garbage text', () => {
    expect(() => validateIndexFormat('Hello World\nThis is not an INDEX')).toThrow(
      /invalid.*index.*format/i,
    );
  });

  it('rejects empty content', () => {
    expect(() => validateIndexFormat('')).toThrow(/invalid.*index.*format/i);
  });

  it('rejects content with only whitespace', () => {
    expect(() => validateIndexFormat('   \n  \n  ')).toThrow(/invalid.*index.*format/i);
  });
});

// ---------------------------------------------------------------------------
// isIndexStale
// ---------------------------------------------------------------------------

describe('isIndexStale', () => {
  it('returns false for freshly fetched metadata', () => {
    const metadata: IndexMetadata = {
      fetchedAt: new Date().toISOString(),
      mirror: 'https://aminet.net',
      sizeBytes: 1000,
      lineCount: 10,
      encoding: 'iso-8859-1',
    };
    expect(isIndexStale(metadata)).toBe(false);
  });

  it('returns true for metadata older than 24 hours', () => {
    const old = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25h ago
    const metadata: IndexMetadata = {
      fetchedAt: old.toISOString(),
      mirror: 'https://aminet.net',
      sizeBytes: 1000,
      lineCount: 10,
      encoding: 'iso-8859-1',
    };
    expect(isIndexStale(metadata)).toBe(true);
  });

  it('uses custom maxAgeMs when provided', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const metadata: IndexMetadata = {
      fetchedAt: twoHoursAgo.toISOString(),
      mirror: 'https://aminet.net',
      sizeBytes: 1000,
      lineCount: 10,
      encoding: 'iso-8859-1',
    };
    // Default 24h: not stale
    expect(isIndexStale(metadata)).toBe(false);
    // Custom 1h: stale
    expect(isIndexStale(metadata, 60 * 60 * 1000)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Cache write/read via loadCachedIndex
// ---------------------------------------------------------------------------

describe('loadCachedIndex', () => {
  let cacheDir: string;

  beforeEach(() => {
    cacheDir = mkdtempSync(join(tmpdir(), 'aminet-test-'));
  });

  afterEach(() => {
    rmSync(cacheDir, { recursive: true, force: true });
  });

  it('returns null when no cache exists', async () => {
    const result = await loadCachedIndex(cacheDir);
    expect(result).toBeNull();
  });

  it('reads cached INDEX and metadata', async () => {
    const content = VALID_INDEX;
    const metadata: IndexMetadata = {
      fetchedAt: new Date().toISOString(),
      mirror: 'https://aminet.net',
      sizeBytes: content.length,
      lineCount: content.split('\n').length,
      encoding: 'iso-8859-1',
    };

    // Simulate cache written by fetchAminetIndex
    writeFileSync(join(cacheDir, 'INDEX'), content, 'utf-8');
    writeFileSync(join(cacheDir, 'INDEX.meta.json'), JSON.stringify(metadata), 'utf-8');

    const result = await loadCachedIndex(cacheDir);
    expect(result).not.toBeNull();
    expect(result!.content).toBe(content);
    expect(result!.metadata.mirror).toBe('https://aminet.net');
    expect(result!.metadata.encoding).toBe('iso-8859-1');
  });
});

// ---------------------------------------------------------------------------
// fetchAminetIndex (mocked HTTP)
// ---------------------------------------------------------------------------

describe('fetchAminetIndex', () => {
  let cacheDir: string;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    cacheDir = mkdtempSync(join(tmpdir(), 'aminet-fetch-'));
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    rmSync(cacheDir, { recursive: true, force: true });
  });

  function mockFetchSuccess(body: Buffer) {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: () => Promise.resolve(body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength)),
    } as unknown as Response);
  }

  function mockFetchFailure(message: string) {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error(message));
  }

  it('downloads, decompresses, validates, and caches INDEX', async () => {
    const compressed = gzipSync(Buffer.from(VALID_INDEX, 'utf-8'));
    mockFetchSuccess(compressed);

    const config: AminetMirrorConfig = {
      mirrors: ['https://aminet.net'],
      userAgent: 'Test/1.0',
      timeoutMs: 5000,
      cacheDir,
    };

    const result = await fetchAminetIndex(config);

    expect(result.content).toBe(VALID_INDEX);
    expect(result.metadata.mirror).toBe('https://aminet.net');
    expect(result.metadata.encoding).toBe('iso-8859-1');
    expect(result.metadata.sizeBytes).toBe(VALID_INDEX.length);

    // Verify cache was written
    expect(existsSync(join(cacheDir, 'INDEX'))).toBe(true);
    expect(existsSync(join(cacheDir, 'INDEX.meta.json'))).toBe(true);

    // Verify fetch was called with correct URL and headers
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://aminet.net/aminet/INDEX.gz',
      expect.objectContaining({
        headers: expect.objectContaining({ 'User-Agent': 'Test/1.0' }),
      }),
    );
  });

  it('preserves ISO-8859-1 characters through full pipeline', async () => {
    // Build an INDEX with Latin-1 characters in the description
    const latin1Content = [
      VALID_HEADER,
      '| test.lha                  | util/misc  |  12k | 365  | By Ren\xe9 Bart\xf1',
    ].join('\n');

    // Encode as ISO-8859-1 bytes (Buffer.from with 'latin1')
    const latin1Buffer = Buffer.from(latin1Content, 'latin1');
    const compressed = gzipSync(latin1Buffer);
    mockFetchSuccess(compressed);

    const config: AminetMirrorConfig = {
      mirrors: ['https://aminet.net'],
      userAgent: 'Test/1.0',
      timeoutMs: 5000,
      cacheDir,
    };

    const result = await fetchAminetIndex(config);

    expect(result.content).toContain('Ren\u00e9');
    expect(result.content).toContain('Bart\u00f1');
    expect(result.content).not.toContain('\uFFFD');
  });

  it('tries next mirror on failure (mirror fallback)', async () => {
    const compressed = gzipSync(Buffer.from(VALID_INDEX, 'utf-8'));

    let callCount = 0;
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      callCount++;
      if (url.includes('bad-mirror')) {
        return Promise.reject(new Error('Connection refused'));
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        arrayBuffer: () =>
          Promise.resolve(
            compressed.buffer.slice(
              compressed.byteOffset,
              compressed.byteOffset + compressed.byteLength,
            ),
          ),
      } as unknown as Response);
    });

    const config: AminetMirrorConfig = {
      mirrors: ['https://bad-mirror.example.com', 'https://aminet.net'],
      userAgent: 'Test/1.0',
      timeoutMs: 5000,
      cacheDir,
    };

    const result = await fetchAminetIndex(config);

    expect(result.content).toBe(VALID_INDEX);
    expect(result.metadata.mirror).toBe('https://aminet.net');
    expect(callCount).toBe(2);
  });

  it('throws descriptive error when all mirrors fail', async () => {
    mockFetchFailure('Connection refused');

    const config: AminetMirrorConfig = {
      mirrors: ['https://mirror1.example.com', 'https://mirror2.example.com'],
      userAgent: 'Test/1.0',
      timeoutMs: 5000,
      cacheDir,
    };

    await expect(fetchAminetIndex(config)).rejects.toThrow(/all.*mirrors.*failed/i);
  });

  it('throws timeout error for slow responses', async () => {
    // Simulate a timeout by using AbortController pattern
    globalThis.fetch = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
      // Immediately abort to simulate timeout
      if (init?.signal) {
        const abortError = new DOMException('The operation was aborted', 'AbortError');
        return Promise.reject(abortError);
      }
      return Promise.reject(new Error('Should have signal'));
    });

    const config: AminetMirrorConfig = {
      mirrors: ['https://aminet.net'],
      userAgent: 'Test/1.0',
      timeoutMs: 100,
      cacheDir,
    };

    await expect(fetchAminetIndex(config)).rejects.toThrow(/abort|timeout|mirrors.*failed/i);
  });
});

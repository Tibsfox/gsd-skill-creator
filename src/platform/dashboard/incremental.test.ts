/**
 * Tests for the incremental build module.
 *
 * Covers:
 * - computeHash returns consistent SHA-256 hex hash for same input
 * - computeHash returns different hash for different input
 * - loadManifest returns empty manifest when file does not exist
 * - saveManifest/loadManifest round-trip preserves data
 * - needsRegeneration returns true when hash differs
 * - needsRegeneration returns true when page not in manifest
 * - needsRegeneration returns false when hash matches
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  computeHash,
  loadManifest,
  saveManifest,
  needsRegeneration,
  type BuildManifest,
} from './incremental.js';

describe('computeHash', () => {
  it('returns consistent hash for same input', () => {
    const hash1 = computeHash('hello world');
    const hash2 = computeHash('hello world');
    expect(hash1).toBe(hash2);
  });

  it('returns a hex string', () => {
    const hash = computeHash('test content');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('returns different hash for different input', () => {
    const hash1 = computeHash('content A');
    const hash2 = computeHash('content B');
    expect(hash1).not.toBe(hash2);
  });
});

describe('loadManifest / saveManifest', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'gsd-manifest-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  });

  it('returns empty manifest when file does not exist', async () => {
    const manifest = await loadManifest(tmpDir);
    expect(manifest).toEqual({ pages: {} });
  });

  it('round-trips manifest data through save and load', async () => {
    const original: BuildManifest = {
      pages: {
        'index.html': { hash: 'abc123', generatedAt: '2026-01-01T00:00:00Z' },
        'roadmap.html': { hash: 'def456', generatedAt: '2026-01-02T00:00:00Z' },
      },
    };

    await saveManifest(tmpDir, original);
    const loaded = await loadManifest(tmpDir);

    expect(loaded).toEqual(original);
  });
});

describe('needsRegeneration', () => {
  it('returns true when page is not in manifest', () => {
    const manifest: BuildManifest = { pages: {} };
    expect(needsRegeneration('index.html', 'somehash', manifest)).toBe(true);
  });

  it('returns true when hash differs from manifest', () => {
    const manifest: BuildManifest = {
      pages: {
        'index.html': { hash: 'oldhash', generatedAt: '2026-01-01T00:00:00Z' },
      },
    };
    expect(needsRegeneration('index.html', 'newhash', manifest)).toBe(true);
  });

  it('returns false when hash matches manifest', () => {
    const manifest: BuildManifest = {
      pages: {
        'index.html': { hash: 'samehash', generatedAt: '2026-01-01T00:00:00Z' },
      },
    };
    expect(needsRegeneration('index.html', 'samehash', manifest)).toBe(false);
  });
});

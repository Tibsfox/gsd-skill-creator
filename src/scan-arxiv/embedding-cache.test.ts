import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  createEmbeddingCache,
  DEFAULT_EMBEDDING_MODEL_ID,
} from './embedding-cache.js';

describe('embedding-cache', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'emb-cache-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns null on miss', async () => {
    const cache = createEmbeddingCache(tmpDir);
    expect(await cache.read('2605.01920v1')).toBeNull();
  });

  it('round-trips a vector', async () => {
    const cache = createEmbeddingCache(tmpDir);
    const vec = Array.from({ length: 384 }, (_, i) => i / 384);
    await cache.write('2605.01920v1', vec);
    const hit = await cache.read('2605.01920v1');
    expect(hit).toEqual(vec);
  });

  it('persists across instances via disk', async () => {
    const writer = createEmbeddingCache(tmpDir);
    await writer.write('2605.01920v1', [1, 2, 3]);
    const reader = createEmbeddingCache(tmpDir);
    expect(await reader.read('2605.01920v1')).toEqual([1, 2, 3]);
  });

  it('serves second read from in-memory map (does not re-read disk)', async () => {
    const cache = createEmbeddingCache(tmpDir);
    await cache.write('2605.01920v1', [1, 2, 3]);
    // Delete the disk file behind cache's back; in-memory should still hit.
    const fp = path.join(tmpDir, '2605.01920v1.json');
    await fsp.unlink(fp);
    expect(await cache.read('2605.01920v1')).toEqual([1, 2, 3]);
  });

  it('writes a sanitized record with model and dim metadata', async () => {
    const cache = createEmbeddingCache(tmpDir);
    await cache.write('2605.01920v1', [0.1, 0.2, 0.3]);
    const raw = await fsp.readFile(path.join(tmpDir, '2605.01920v1.json'), 'utf-8');
    const parsed = JSON.parse(raw);
    expect(parsed.version).toBe('v1');
    expect(parsed.model).toBe(DEFAULT_EMBEDDING_MODEL_ID);
    expect(parsed.dim).toBe(3);
    expect(parsed.vec).toEqual([0.1, 0.2, 0.3]);
  });

  it('treats records from a different model as a miss', async () => {
    // Write with one model, read with another — should miss.
    const cacheA = createEmbeddingCache(tmpDir, false, 'modelA');
    await cacheA.write('2605.01920v1', [1, 2, 3]);
    const cacheB = createEmbeddingCache(tmpDir, false, 'modelB');
    expect(await cacheB.read('2605.01920v1')).toBeNull();
  });

  it('disabled mode never reads or writes', async () => {
    const cache = createEmbeddingCache(tmpDir, true);
    await cache.write('2605.01920v1', [1, 2, 3]);
    expect(await cache.read('2605.01920v1')).toBeNull();
    expect(fs.readdirSync(tmpDir)).toEqual([]);
  });

  it('sanitizes ids containing path-unfriendly characters', async () => {
    const cache = createEmbeddingCache(tmpDir);
    await cache.write('weird/id\\with:bad*chars', [1, 2, 3]);
    const files = fs.readdirSync(tmpDir);
    expect(files).toHaveLength(1);
    expect(files[0]).not.toMatch(/[\\/:*]/);
    // Round-trip still works on the original id.
    expect(await cache.read('weird/id\\with:bad*chars')).toEqual([1, 2, 3]);
  });

  it('tolerates corrupt cache files (returns null)', async () => {
    const cache = createEmbeddingCache(tmpDir);
    await fsp.writeFile(path.join(tmpDir, '2605.01920v1.json'), 'not-json', 'utf-8');
    expect(await cache.read('2605.01920v1')).toBeNull();
  });
});

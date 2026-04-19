/**
 * Persistence tests — JSONL round-trip is lossless on every value.
 *
 * @module embeddings/__tests__/persist.test
 */

import { describe, it, expect } from 'vitest';
import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  serializeStore,
  deserializeStore,
  saveStore,
  loadStore,
  EMBEDDINGS_FORMAT_VERSION,
} from '../persist.js';
import { buildStore } from '../api.js';
import { createSkipGramModel } from '../skip-gram.js';
import { mulberry32 } from '../trainer.js';

function makeStore(vocabSize = 5, dim = 4, seed = 101) {
  const vocabulary = Array.from({ length: vocabSize }, (_, i) => `ent_${i}`);
  const vocabIndex = new Map(vocabulary.map((v, i) => [v, i]));
  const model = createSkipGramModel(vocabSize, dim, mulberry32(seed));
  return buildStore(model, vocabulary, vocabIndex);
}

describe('serialize/deserialize round-trip', () => {
  it('preserves vocabulary, dimensions, and every float value', () => {
    const original = makeStore(7, 6, 2025);
    const jsonl = serializeStore(original, 123456);
    const loaded = deserializeStore(jsonl);
    expect(loaded).not.toBeNull();
    if (!loaded) return;
    expect(loaded.dim).toBe(original.dim);
    expect(loaded.vocabulary).toEqual([...original.vocabulary]);
    expect(loaded.matrix.length).toBe(original.matrix.length);
    for (let i = 0; i < original.matrix.length; i++) {
      expect(loaded.matrix[i]).toBe(original.matrix[i]);
    }
    // vocabIndex reconstructed.
    for (const [id, idx] of original.vocabIndex.entries()) {
      expect(loaded.vocabIndex.get(id)).toBe(idx);
    }
  });

  it('header reports the current format version', () => {
    const store = makeStore(2, 2);
    const jsonl = serializeStore(store);
    const header = JSON.parse(jsonl.split('\n')[0]);
    expect(header.kind).toBe('md1-header');
    expect(header.version).toBe(EMBEDDINGS_FORMAT_VERSION);
    expect(header.dim).toBe(2);
    expect(header.vocabSize).toBe(2);
  });

  it('returns null for malformed input', () => {
    expect(deserializeStore('')).toBeNull();
    expect(deserializeStore('not json')).toBeNull();
    expect(deserializeStore('{"kind":"wrong"}\n')).toBeNull();
  });

  it('returns null for version mismatch', () => {
    const bad = JSON.stringify({
      kind: 'md1-header',
      version: 999,
      dim: 2,
      vocabSize: 0,
      createdAt: 0,
    });
    expect(deserializeStore(bad + '\n')).toBeNull();
  });

  it('returns null when line count does not match header vocabSize', () => {
    const store = makeStore(3, 2);
    let jsonl = serializeStore(store);
    const lines = jsonl.trim().split('\n');
    // Drop the last entry → mismatch.
    jsonl = lines.slice(0, -1).join('\n') + '\n';
    expect(deserializeStore(jsonl)).toBeNull();
  });

  it('returns null when an entry has wrong dim', () => {
    const store = makeStore(2, 4);
    const jsonl = serializeStore(store);
    const lines = jsonl.trim().split('\n');
    // Corrupt second entry's values length.
    const entry = JSON.parse(lines[1]);
    entry.values = entry.values.slice(0, -1);
    lines[1] = JSON.stringify(entry);
    expect(deserializeStore(lines.join('\n') + '\n')).toBeNull();
  });

  it('returns null when duplicate idx is present', () => {
    const store = makeStore(3, 2);
    const jsonl = serializeStore(store);
    const lines = jsonl.trim().split('\n');
    // Make line 2 have the same idx as line 1.
    const e = JSON.parse(lines[2]);
    e.idx = 0;
    lines[2] = JSON.stringify(e);
    expect(deserializeStore(lines.join('\n') + '\n')).toBeNull();
  });

  it('empty vocabulary round-trips as dim-only header', () => {
    const vocabulary: string[] = [];
    const vocabIndex = new Map<string, number>();
    // vocabSize=0 is a degenerate but legal state — the trainer produces it
    // when there are no in-vocab traces. We validate the header-only
    // round-trip. `createSkipGramModel(0, ...)` throws, so construct by hand.
    const store = {
      vocabulary,
      vocabIndex,
      dim: 4,
      matrix: new Float64Array(0),
    };
    const jsonl = serializeStore(store);
    const loaded = deserializeStore(jsonl);
    expect(loaded).not.toBeNull();
    if (!loaded) return;
    expect(loaded.vocabulary).toEqual([]);
    expect(loaded.dim).toBe(4);
    expect(loaded.matrix.length).toBe(0);
  });
});

describe('disk IO', () => {
  it('save + load round-trips through a temp file', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'md1-persist-'));
    const filePath = path.join(tmp, 'nested', 'embeddings.jsonl');
    const store = makeStore(4, 5, 77);
    try {
      await saveStore(store, filePath);
      const loaded = await loadStore(filePath);
      expect(loaded).not.toBeNull();
      if (!loaded) return;
      expect(loaded.vocabulary).toEqual([...store.vocabulary]);
      for (let i = 0; i < store.matrix.length; i++) {
        expect(loaded.matrix[i]).toBe(store.matrix[i]);
      }
    } finally {
      await fs.rm(tmp, { recursive: true, force: true });
    }
  });

  it('load returns null when the file does not exist', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'md1-persist-'));
    try {
      const missing = path.join(tmp, 'absent.jsonl');
      expect(await loadStore(missing)).toBeNull();
    } finally {
      await fs.rm(tmp, { recursive: true, force: true });
    }
  });

  it('load returns null for a corrupt file', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'md1-persist-'));
    try {
      const corrupt = path.join(tmp, 'bad.jsonl');
      await fs.writeFile(corrupt, 'not jsonl at all\n', 'utf8');
      expect(await loadStore(corrupt)).toBeNull();
    } finally {
      await fs.rm(tmp, { recursive: true, force: true });
    }
  });
});

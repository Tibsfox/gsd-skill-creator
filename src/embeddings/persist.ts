/**
 * MD-1 Shallow Learned Embeddings — JSONL persistence.
 *
 * Round-trip-lossless disk format for `LearnedEmbeddingStore`. The default
 * path lives under `.planning/embeddings/embeddings.jsonl` which is
 * gitignored by the project-wide `.planning/` rule.
 *
 * Format:
 *   line 1 (header): {"kind":"md1-header","version":1,"dim":D,"vocabSize":N,"createdAt":<ms>}
 *   lines 2..N+1  : {"kind":"md1-entry","idx":I,"id":<string>,"values":[...D floats]}
 *
 * Every embedding value round-trips through `Number.prototype.toString()`
 * which IEEE 754 guarantees is lossless for Float64. Loads that fail
 * schema validation return `null`.
 *
 * @module embeddings/persist
 */

import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import type { LearnedEmbeddingStore } from './api.js';

// ─── Constants ──────────────────────────────────────────────────────────────

/** Default on-disk location (under gitignored `.planning/`). */
export const DEFAULT_EMBEDDINGS_PATH =
  '.planning/embeddings/embeddings.jsonl';

/** Persisted format version. Bump on breaking changes. */
export const EMBEDDINGS_FORMAT_VERSION = 1;

// ─── Serialisation ──────────────────────────────────────────────────────────

interface HeaderLine {
  kind: 'md1-header';
  version: number;
  dim: number;
  vocabSize: number;
  createdAt: number;
}

interface EntryLine {
  kind: 'md1-entry';
  idx: number;
  id: string;
  values: number[];
}

/**
 * Serialise a store to JSONL string. Pure function; safe for in-memory
 * round-trip tests.
 */
export function serializeStore(
  store: LearnedEmbeddingStore,
  createdAt: number = Date.now(),
): string {
  const header: HeaderLine = {
    kind: 'md1-header',
    version: EMBEDDINGS_FORMAT_VERSION,
    dim: store.dim,
    vocabSize: store.vocabulary.length,
    createdAt,
  };
  const lines: string[] = [JSON.stringify(header)];
  for (let i = 0; i < store.vocabulary.length; i++) {
    const values = new Array<number>(store.dim);
    const base = i * store.dim;
    for (let k = 0; k < store.dim; k++) values[k] = store.matrix[base + k];
    const entry: EntryLine = {
      kind: 'md1-entry',
      idx: i,
      id: store.vocabulary[i],
      values,
    };
    lines.push(JSON.stringify(entry));
  }
  return lines.join('\n') + '\n';
}

/**
 * Parse a JSONL string back into a store. Returns `null` if the payload
 * is malformed, has a version mismatch, or is missing entries.
 */
export function deserializeStore(jsonl: string): LearnedEmbeddingStore | null {
  const lines = jsonl.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length === 0) return null;

  let header: HeaderLine | null = null;
  try {
    const h = JSON.parse(lines[0]) as unknown;
    if (
      !h ||
      typeof h !== 'object' ||
      (h as { kind?: unknown }).kind !== 'md1-header'
    ) {
      return null;
    }
    header = h as HeaderLine;
    if (header.version !== EMBEDDINGS_FORMAT_VERSION) return null;
    if (!Number.isInteger(header.dim) || header.dim <= 0) return null;
    if (!Number.isInteger(header.vocabSize) || header.vocabSize < 0) return null;
  } catch {
    return null;
  }

  const { dim, vocabSize } = header;
  if (lines.length !== vocabSize + 1) return null;

  const vocabulary = new Array<string>(vocabSize);
  const matrix = new Float64Array(vocabSize * dim);
  const seenIdx = new Set<number>();

  for (let i = 1; i < lines.length; i++) {
    let entry: EntryLine;
    try {
      const raw = JSON.parse(lines[i]) as unknown;
      if (
        !raw ||
        typeof raw !== 'object' ||
        (raw as { kind?: unknown }).kind !== 'md1-entry'
      ) {
        return null;
      }
      entry = raw as EntryLine;
    } catch {
      return null;
    }
    if (
      !Number.isInteger(entry.idx) ||
      entry.idx < 0 ||
      entry.idx >= vocabSize
    ) {
      return null;
    }
    if (seenIdx.has(entry.idx)) return null;
    seenIdx.add(entry.idx);
    if (typeof entry.id !== 'string') return null;
    if (!Array.isArray(entry.values) || entry.values.length !== dim) {
      return null;
    }
    vocabulary[entry.idx] = entry.id;
    const base = entry.idx * dim;
    for (let k = 0; k < dim; k++) {
      const v = entry.values[k];
      if (typeof v !== 'number' || !Number.isFinite(v)) return null;
      matrix[base + k] = v;
    }
  }

  const vocabIndex = new Map<string, number>();
  for (let i = 0; i < vocabSize; i++) vocabIndex.set(vocabulary[i], i);

  return {
    vocabulary,
    vocabIndex,
    dim,
    matrix,
  };
}

// ─── Disk IO ────────────────────────────────────────────────────────────────

/**
 * Write a store to `filePath`, creating the parent directory if needed.
 */
export async function saveStore(
  store: LearnedEmbeddingStore,
  filePath: string = DEFAULT_EMBEDDINGS_PATH,
): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const payload = serializeStore(store);
  await fs.writeFile(filePath, payload, 'utf8');
}

/**
 * Load a store from `filePath`. Returns `null` if the file does not exist
 * or if parsing fails.
 */
export async function loadStore(
  filePath: string = DEFAULT_EMBEDDINGS_PATH,
): Promise<LearnedEmbeddingStore | null> {
  let payload: string;
  try {
    payload = await fs.readFile(filePath, 'utf8');
  } catch (err: unknown) {
    if (
      typeof err === 'object' &&
      err !== null &&
      (err as { code?: string }).code === 'ENOENT'
    ) {
      return null;
    }
    throw err;
  }
  return deserializeStore(payload);
}

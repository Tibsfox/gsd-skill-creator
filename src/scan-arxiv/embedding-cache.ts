// Per-paper embedding cache for the scan-arxiv ranker.
//
// preRank() embeds every surviving paper on every batch. For a wide-sweep
// run (~5,000 papers), re-embedding takes ~15 minutes. This cache stores
// the 384-dim float32 vector per arxivId in a one-file-per-paper layout
// at `.planning/arxiv-cache/embeddings/<arxivId>.json`, mirroring the
// relevance score cache in ranker.ts.
//
// Cache entries are invalidated when the embedding model changes (the
// `model` field in the record must match the consumer's expected model).

import { promises as fs } from 'node:fs';
import * as path from 'node:path';

/** Default location, parallel to .planning/arxiv-cache/scores/. */
export const DEFAULT_EMBEDDING_CACHE_DIR = '.planning/arxiv-cache/embeddings';

/** Default model identifier — matches src/embeddings/embedding-service.ts. */
export const DEFAULT_EMBEDDING_MODEL_ID = 'Xenova/bge-small-en-v1.5';

export interface EmbeddingCache {
  read(arxivId: string): Promise<number[] | null>;
  write(arxivId: string, vec: number[]): Promise<void>;
}

interface CacheRecord {
  version: 'v1';
  model: string;
  dim: number;
  vec: number[];
}

/**
 * Build an embedding cache backed by JSON files at `cacheDir`. When
 * `disabled` is true (e.g., RankerOptions.noEmbeddingCache), returns a
 * no-op cache that always misses. When the on-disk record's `model`
 * field doesn't match `model`, reads return null (stale model = miss).
 */
export function createEmbeddingCache(
  cacheDir: string = DEFAULT_EMBEDDING_CACHE_DIR,
  disabled = false,
  model: string = DEFAULT_EMBEDDING_MODEL_ID,
): EmbeddingCache {
  if (disabled) {
    return {
      async read() { return null; },
      async write() { /* no-op */ },
    };
  }

  const memory = new Map<string, number[]>();

  return {
    async read(arxivId: string) {
      const inMem = memory.get(arxivId);
      if (inMem) return inMem;
      try {
        const fp = path.join(cacheDir, `${sanitizeId(arxivId)}.json`);
        const raw = await fs.readFile(fp, 'utf-8');
        const parsed = JSON.parse(raw) as CacheRecord;
        if (parsed.version !== 'v1' || parsed.model !== model) return null;
        if (!Array.isArray(parsed.vec)) return null;
        memory.set(arxivId, parsed.vec);
        return parsed.vec;
      } catch {
        return null;
      }
    },

    async write(arxivId: string, vec: number[]) {
      memory.set(arxivId, vec);
      try {
        await fs.mkdir(cacheDir, { recursive: true });
        const fp = path.join(cacheDir, `${sanitizeId(arxivId)}.json`);
        const record: CacheRecord = {
          version: 'v1',
          model,
          dim: vec.length,
          vec,
        };
        await fs.writeFile(fp, JSON.stringify(record), 'utf-8');
      } catch {
        // Non-fatal: in-memory copy still services subsequent reads.
      }
    },
  };
}

function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9.\-_]/g, '_');
}

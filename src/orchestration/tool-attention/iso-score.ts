/**
 * HB-01 — Intent Schema Overlap (ISO) score.
 *
 * Ranks loaded tools by relevance to the current turn's intent via
 * cosine-similarity of sentence embeddings. Pinned tools always sort first;
 * everything else is ordered by descending cosine.
 *
 * Default-OFF: when `cs25-26-sweep.tool-attention.enabled === false` the
 * function returns the disabled-result sentinel without inspecting input.
 *
 * note: when no project-tier sentence-embedding utility is available, the
 * caller can use `hashingEmbedding(text, dim)` (provided here) as a
 * deterministic, content-aware substitute. Hashing-vectors give a stable
 * approximation of cosine-similarity for short inputs (tool names + short
 * descriptions); they are not a replacement for a real LM-tier embedding,
 * but the substrate ranks correctness, not retrieval quality.
 *
 * @module orchestration/tool-attention/iso-score
 */

import { isToolAttentionEnabled } from './settings.js';
import type {
  EmbeddingVector,
  IsoScoreEntry,
  IsoScoreOutput,
  IsoScoreDisabled,
  ToolEmbeddingSidecar,
  TaskPhase,
} from './types.js';

const DISABLED_RESULT: IsoScoreDisabled = Object.freeze({
  ranked: [] as never[],
  intentEmbedding: [] as never[],
  disabled: true,
});

/**
 * Cosine similarity. Returns 0 for zero-length vectors and on length mismatch.
 */
export function cosineSimilarity(a: EmbeddingVector, b: EmbeddingVector): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    const ai = a[i] ?? 0;
    const bi = b[i] ?? 0;
    dot += ai * bi;
    normA += ai * ai;
    normB += bi * bi;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Hashing-vector fallback embedding. Deterministic per-input. Token-frequency
 * style: tokens are hashed into `dim` buckets, signed by the high bit of a
 * second hash. Provides stable cosine geometry for short inputs.
 */
export function hashingEmbedding(text: string, dim: number = 64): number[] {
  const v = new Array<number>(dim).fill(0);
  if (!text || dim <= 0) return v;
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 0);
  for (const tok of tokens) {
    const h1 = fnv1a(tok);
    const h2 = fnv1a(tok + '#sign');
    const idx = h1 % dim;
    const sign = (h2 & 0x1) === 0 ? 1 : -1;
    v[idx] = (v[idx] ?? 0) + sign;
  }
  // L2 normalize for stability.
  let norm = 0;
  for (const x of v) norm += x * x;
  if (norm > 0) {
    const inv = 1 / Math.sqrt(norm);
    for (let i = 0; i < v.length; i++) v[i] = (v[i] ?? 0) * inv;
  }
  return v;
}

function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/**
 * Compute ISO scores for a list of tool sidecars against an intent embedding.
 *
 * Phase-pinned tools (those whose `phasePins` includes `currentPhase`) are
 * always emitted first regardless of cosine score. Their `pinned` flag is
 * true. Remaining tools are sorted by descending cosine.
 *
 * Determinism: identical inputs produce identical outputs. Tie-break is
 * stable on the input order (sidecars list).
 *
 * @param sidecars Per-tool embedding sidecars (precomputed).
 * @param intentEmbedding Embedding of the current turn's intent text.
 * @param currentPhase Optional phase used to expand pin set.
 * @param settingsPath Optional config override for tests.
 */
export function computeIsoScore(
  sidecars: readonly ToolEmbeddingSidecar[],
  intentEmbedding: EmbeddingVector,
  currentPhase?: TaskPhase,
  settingsPath?: string,
): IsoScoreOutput | IsoScoreDisabled {
  if (!isToolAttentionEnabled(settingsPath)) return DISABLED_RESULT;

  const ranked: IsoScoreEntry[] = [];
  const phase = currentPhase ?? 'unknown';
  for (let i = 0; i < sidecars.length; i++) {
    const s = sidecars[i]!;
    const score = cosineSimilarity(s.embedding, intentEmbedding);
    const pinned = !!(s.phasePins && s.phasePins.includes(phase));
    ranked.push({ name: s.name, score, pinned });
  }
  // Stable sort: pinned first, then by score desc, then input order.
  const indexed = ranked.map((r, i) => ({ r, i }));
  indexed.sort((a, b) => {
    if (a.r.pinned !== b.r.pinned) return a.r.pinned ? -1 : 1;
    if (b.r.score !== a.r.score) return b.r.score - a.r.score;
    return a.i - b.i;
  });
  return {
    ranked: indexed.map((x) => x.r),
    intentEmbedding: intentEmbedding.slice(),
  };
}

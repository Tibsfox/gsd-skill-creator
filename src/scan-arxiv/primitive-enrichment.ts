// Embedding-based enrichment for accumulated arxiv primitives.
//
// The regex extractor in src/learn/extractor.ts produces primitives with
// empty `compositionRules` and a single per-document `planePosition`. The
// team generator can't fire on single-quadrant runs (it needs >=2
// quadrants + 20 cross-quadrant rules). This module post-processes the
// accumulated primitive set to:
//
//   1. Derive composition rules from pairwise cosine similarity over
//      `formalStatement` embeddings. Rules where both primitives share a
//      `sourceId` (same paper) are 'sequential'; otherwise 'parallel'.
//
//   2. Refine each primitive's `planePosition` by projecting its
//      formalStatement embedding onto four reference anchors
//      (logic / creativity / embodied / abstract). The two axes are
//      contrast-of-cosine-sims, clamped to [-1, 1].
//
// Both functions return new arrays (immutable) and depend only on an
// injected TextEmbedder + cosineSimilarity, so they are unit-testable
// without hitting a model.

import type { MathematicalPrimitive, PlanePosition, CompositionRule, CompositionType } from '../types/mfe-types.js';
import { cosineSimilarity } from '../embeddings/cosine-similarity.js';

export type TextEmbedder = (text: string) => Promise<number[]>;

// === Plane reference anchors ===
//
// Two contrastive axes, four anchor strings. Each primitive's
// formalStatement is embedded once, then projected onto each axis as
// `cosine(creativity_anchor) - cosine(logic_anchor)` for the real axis
// and `cosine(abstract_anchor) - cosine(embodied_anchor)` for the
// imaginary axis. Clamped to [-1, 1].

const LOGIC_ANCHOR =
  'formal deductive logic, mathematical proof, theorem, axiom, rigorous derivation, symbolic manipulation';
const CREATIVITY_ANCHOR =
  'creative synthesis, generative design, ideation, novel composition, exploratory invention, open-ended construction';
const EMBODIED_ANCHOR =
  'concrete physical procedure, step-by-step mechanical execution, hands-on implementation, deterministic instruction sequence, runtime operation';
const ABSTRACT_ANCHOR =
  'abstract concept, theoretical framework, symbolic representation, formal definition, conceptual model';

export const PLANE_ANCHORS = {
  logic: LOGIC_ANCHOR,
  creativity: CREATIVITY_ANCHOR,
  embodied: EMBODIED_ANCHOR,
  abstract: ABSTRACT_ANCHOR,
} as const;

function clamp1(n: number): number {
  if (!Number.isFinite(n)) return 0;
  if (n < -1) return -1;
  if (n > 1) return 1;
  return n;
}

// === Plane refinement ===

export interface RefinePlaneOptions {
  embedder: TextEmbedder;
  /** Pre-computed primitive embeddings (parallel to primitives), if
   *  callers already embedded for composition derivation. */
  primitiveEmbeddings?: number[][];
}

export async function refinePlanePositions(
  primitives: MathematicalPrimitive[],
  opts: RefinePlaneOptions,
): Promise<MathematicalPrimitive[]> {
  if (primitives.length === 0) return [];

  // Embed each anchor once.
  const logicVec = await opts.embedder(LOGIC_ANCHOR);
  const creativityVec = await opts.embedder(CREATIVITY_ANCHOR);
  const embodiedVec = await opts.embedder(EMBODIED_ANCHOR);
  const abstractVec = await opts.embedder(ABSTRACT_ANCHOR);

  // Embed each primitive (or use pre-computed).
  const primitiveVecs: number[][] = opts.primitiveEmbeddings ?? [];
  if (primitiveVecs.length !== primitives.length) {
    primitiveVecs.length = 0;
    for (const p of primitives) {
      primitiveVecs.push(await opts.embedder(p.formalStatement || p.name));
    }
  }

  return primitives.map((p, i) => {
    const v = primitiveVecs[i];
    const realAxis = clamp1(
      cosineSimilarity(v, creativityVec) - cosineSimilarity(v, logicVec),
    );
    const imagAxis = clamp1(
      cosineSimilarity(v, abstractVec) - cosineSimilarity(v, embodiedVec),
    );
    const newPos: PlanePosition = { real: realAxis, imaginary: imagAxis };
    return { ...p, planePosition: newPos };
  });
}

// === Composition rule derivation ===

export interface DeriveCompositionsOptions {
  embedder: TextEmbedder;
  /** Cosine similarity threshold for a pair to count as composable. */
  similarityThreshold?: number;
  /** Maximum composition rules attached to a single primitive. */
  maxRulesPerPrimitive?: number;
  /** Pre-computed primitive embeddings (parallel to primitives). */
  primitiveEmbeddings?: number[][];
}

interface NeighborCandidate {
  index: number;
  similarity: number;
}

/**
 * For each primitive, find its top-K nearest neighbors by cosine and
 * attach them as composition rules. Rule type is `sequential` if both
 * primitives share a source paper (encoded as id prefix before the last
 * '-'), `parallel` otherwise. Returns a new array; inputs unmodified.
 */
export async function deriveCompositions(
  primitives: MathematicalPrimitive[],
  opts: DeriveCompositionsOptions,
): Promise<MathematicalPrimitive[]> {
  if (primitives.length === 0) return [];

  const threshold = opts.similarityThreshold ?? 0.7;
  const maxRules = opts.maxRulesPerPrimitive ?? 8;

  // Embed each primitive's formalStatement once.
  const vecs: number[][] = opts.primitiveEmbeddings ?? [];
  if (vecs.length !== primitives.length) {
    vecs.length = 0;
    for (const p of primitives) {
      vecs.push(await opts.embedder(p.formalStatement || p.name));
    }
  }

  // Pair-wise top-K via priority filter. O(n^2) cosine but cheap on 384-dim.
  const enriched: MathematicalPrimitive[] = [];
  for (let i = 0; i < primitives.length; i++) {
    const neighbors: NeighborCandidate[] = [];
    for (let j = 0; j < primitives.length; j++) {
      if (i === j) continue;
      if (primitives[i].id === primitives[j].id) continue;
      const sim = cosineSimilarity(vecs[i], vecs[j]);
      if (sim >= threshold) {
        neighbors.push({ index: j, similarity: sim });
      }
    }
    neighbors.sort((a, b) => b.similarity - a.similarity);
    const top = neighbors.slice(0, maxRules);

    const sourceI = sourceIdOf(primitives[i].id);
    const newRules: CompositionRule[] = top.map((n) => {
      const peer = primitives[n.index];
      const sourceJ = sourceIdOf(peer.id);
      const type: CompositionType = sourceI === sourceJ ? 'sequential' : 'parallel';
      return {
        with: peer.id,
        yields: `${primitives[i].name} + ${peer.name}`,
        type,
        conditions: [`cosine(formalStatement) >= ${n.similarity.toFixed(3)}`],
        example: 'derived from embedding proximity over arxiv primitives',
      };
    });

    enriched.push({
      ...primitives[i],
      compositionRules: [...primitives[i].compositionRules, ...newRules],
    });
  }

  return enriched;
}

/**
 * Heuristic for "did these primitives come from the same source paper?"
 * Primitive IDs follow `<sourceId>-<slugified-concept>[-N]` per
 * src/learn/extractor.ts. Strip the trailing concept slug; what remains
 * is the source identifier.
 */
function sourceIdOf(id: string): string {
  const lastDash = id.lastIndexOf('-');
  if (lastDash < 0) return id;
  // Handle id-suffix-N collisions (e.g. 'arxiv-cs-foo-1'); strip a trailing
  // numeric suffix before the source split.
  const tail = id.slice(lastDash + 1);
  if (/^\d+$/.test(tail)) {
    const prev = id.lastIndexOf('-', lastDash - 1);
    if (prev > 0) return id.slice(0, prev);
  }
  return id.slice(0, lastDash);
}

// === Helpers ===

/**
 * Compute and return primitive embeddings — a one-pass embedding step
 * shared between composition derivation and plane refinement to avoid
 * embedding the same text twice.
 */
export async function embedPrimitives(
  primitives: MathematicalPrimitive[],
  embedder: TextEmbedder,
): Promise<number[][]> {
  const out: number[][] = [];
  for (const p of primitives) {
    out.push(await embedder(p.formalStatement || p.name));
  }
  return out;
}

export { sourceIdOf as __sourceIdOfForTests };

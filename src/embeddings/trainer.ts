/**
 * MD-1 Shallow Learned Embeddings — training outer loop.
 *
 * Orchestrates co-occurrence extraction + skip-gram SGD over a DecisionTrace
 * stream. Deterministic given seed; converges or halts at `maxEpochs`.
 *
 * The negative-sampling distribution follows Mikolov 2013: P(w) ∝ count(w)^0.75.
 * The sampling table is a power-of-two-sized array indexed by a RNG-derived
 * hash, providing O(1) draws.
 *
 * @module embeddings/trainer
 */

import type { DecisionTrace } from '../types/memory.js';
import {
  extractCoOccurrencePairs,
  projectPairsToIds,
  type CoOccurrenceOptions,
} from './co-occurrence.js';
import {
  createSkipGramModel,
  evalLoss,
  trainStep,
  type SkipGramModel,
} from './skip-gram.js';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface TrainEmbeddingsOptions {
  /** Embedding dimension. Default 32 (MD-1 spec). */
  embedDim?: number;
  /** Co-occurrence window passed to the extractor. Default 5. */
  windowSize?: number;
  /** Minimum entity frequency for vocabulary inclusion. Default 2. */
  minCount?: number;
  /** Number of negative samples per positive pair. Default 5. */
  negativeSamples?: number;
  /** Initial learning rate; decayed linearly to `minLearningRate`. Default 0.025. */
  learningRate?: number;
  /** Floor learning rate at end of training. Default 0.0001. */
  minLearningRate?: number;
  /** Maximum number of epochs. Default 5. */
  maxEpochs?: number;
  /**
   * L2 drift convergence threshold. When the RMS change in the input
   * embedding matrix between successive epochs drops below this, training
   * halts early (CF-MD1-03). Default 0.01.
   */
  convergenceTolerance?: number;
  /** Deterministic RNG seed. Default 42. */
  seed?: number;
  /**
   * If supplied, the extractor is skipped and these pre-extracted integer
   * pairs are used instead (useful for tests and fixtures). When set, the
   * caller must also supply `vocabulary` and `counts`.
   */
  preExtracted?: {
    vocabulary: string[];
    counts: Map<string, number>;
    pairs: Array<{ center: number; context: number }>;
  };
}

export interface TrainEmbeddingsResult {
  model: SkipGramModel;
  vocabulary: string[];
  vocabIndex: Map<string, number>;
  counts: Map<string, number>;
  /** Number of epochs actually executed. */
  epochsRun: number;
  /** Mean SGNS loss over the last epoch. */
  finalLoss: number;
  /** L2 drift recorded at the epoch that triggered convergence (or last). */
  finalDrift: number;
}

// ─── Mulberry32 (shared PRNG) ───────────────────────────────────────────────

/**
 * Mulberry32 PRNG, matching `src/graph/leiden.ts`. Pure function of seed;
 * identical seed → identical stream.
 */
export function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return function () {
    t = (t + 0x6d2b79f5) >>> 0;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Negative sampling table ────────────────────────────────────────────────

/**
 * Build an O(1)-draw negative-sampling table using unigram^0.75 weighting
 * (Mikolov 2013). Table size is fixed at 1,048,576 entries (1 MiB × 4 B =
 * 4 MiB) or smaller for tiny vocabularies.
 */
export function buildNegativeTable(
  vocabSize: number,
  counts: readonly number[],
  exponent = 0.75,
): Int32Array {
  if (vocabSize === 0) return new Int32Array(0);
  const tableSize = Math.min(1 << 20, Math.max(vocabSize * 100, 1024));
  const table = new Int32Array(tableSize);

  // Compute Z = Σ count_i^exp and per-id cumulative fraction.
  let total = 0;
  const weights = new Float64Array(vocabSize);
  for (let i = 0; i < vocabSize; i++) {
    weights[i] = Math.pow(Math.max(counts[i], 0), exponent);
    total += weights[i];
  }
  if (total === 0) {
    // Degenerate: fill uniformly.
    for (let i = 0; i < tableSize; i++) table[i] = i % vocabSize;
    return table;
  }

  let i = 0;
  let cumulative = weights[0] / total;
  for (let k = 0; k < tableSize; k++) {
    table[k] = i;
    const frac = (k + 1) / tableSize;
    while (frac > cumulative && i < vocabSize - 1) {
      i++;
      cumulative += weights[i] / total;
    }
  }
  return table;
}

function drawNegatives(
  table: Int32Array,
  count: number,
  avoid: number,
  rand: () => number,
): number[] {
  const out: number[] = [];
  if (table.length === 0) return out;
  for (let attempts = 0; attempts < count * 10 && out.length < count; attempts++) {
    const idx = Math.floor(rand() * table.length) % table.length;
    const id = table[idx];
    if (id === avoid) continue;
    out.push(id);
  }
  // If the draw loop starved (very rare), pad with `avoid+1 mod vocab` so
  // we still emit `count` negatives; training remains well-defined.
  while (out.length < count) out.push((avoid + 1 + out.length) % table.length);
  return out;
}

// ─── Training ───────────────────────────────────────────────────────────────

/**
 * Train a skip-gram embedding over a DecisionTrace stream. Returns a
 * fully-initialised `SkipGramModel` + the vocabulary it was trained over.
 *
 * The trainer is deterministic: fixed `seed`, fixed traces, fixed options →
 * fixed embeddings (validated by `trainer.test.ts` determinism fixture).
 */
export function trainEmbeddings(
  traces: readonly DecisionTrace[],
  options: TrainEmbeddingsOptions = {},
): TrainEmbeddingsResult {
  const embedDim = options.embedDim ?? 32;
  const windowSize = options.windowSize ?? 5;
  const minCount = options.minCount ?? 2;
  const negativeSamples = options.negativeSamples ?? 5;
  const learningRate = options.learningRate ?? 0.025;
  const minLearningRate = options.minLearningRate ?? 0.0001;
  const maxEpochs = options.maxEpochs ?? 5;
  const convergenceTolerance = options.convergenceTolerance ?? 0.01;
  const seed = options.seed ?? 42;

  const rand = mulberry32(seed);

  // ─── Step 1: co-occurrence extraction ───
  let vocabulary: string[];
  let vocabIndex: Map<string, number>;
  let intPairs: Array<{ center: number; context: number }>;
  let countsMap: Map<string, number>;

  if (options.preExtracted) {
    vocabulary = options.preExtracted.vocabulary.slice();
    vocabIndex = new Map(vocabulary.map((v, i) => [v, i]));
    countsMap = new Map(options.preExtracted.counts);
    intPairs = options.preExtracted.pairs.slice();
  } else {
    const co = extractCoOccurrencePairs(traces, {
      windowSize,
      minCount,
      excludeSelfPairs: true,
      deduplicate: false,
    } satisfies CoOccurrenceOptions);
    vocabulary = co.vocabulary;
    vocabIndex = co.vocabIndex;
    countsMap = co.counts;
    intPairs = projectPairsToIds(co.pairs, co.vocabIndex);
  }

  const vocabSize = vocabulary.length;
  if (vocabSize === 0 || intPairs.length === 0) {
    // Degenerate: no signal. Return a zero-init model with empty vocab.
    return {
      model: {
        vocabSize: 0,
        dim: embedDim,
        inputEmbeddings: new Float64Array(0),
        outputEmbeddings: new Float64Array(0),
      },
      vocabulary: [],
      vocabIndex: new Map(),
      counts: countsMap,
      epochsRun: 0,
      finalLoss: 0,
      finalDrift: 0,
    };
  }

  // ─── Step 2: model + negative table ───
  const model = createSkipGramModel(vocabSize, embedDim, rand);
  const vocabCounts = vocabulary.map((id) => countsMap.get(id) ?? 0);
  const negativeTable = buildNegativeTable(vocabSize, vocabCounts);

  // ─── Step 3: SGD epochs ───
  let epochsRun = 0;
  let finalLoss = 0;
  let finalDrift = Infinity;
  let prevSnapshot = new Float64Array(model.inputEmbeddings);

  for (let epoch = 0; epoch < maxEpochs; epoch++) {
    // Linearly decay learning rate from `learningRate` to `minLearningRate`.
    const t = maxEpochs > 1 ? epoch / (maxEpochs - 1) : 0;
    const lr = learningRate + (minLearningRate - learningRate) * t;

    // Shuffle pair order deterministically.
    const order = new Int32Array(intPairs.length);
    for (let i = 0; i < intPairs.length; i++) order[i] = i;
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      const tmp = order[i];
      order[i] = order[j];
      order[j] = tmp;
    }

    let lossSum = 0;
    for (let k = 0; k < order.length; k++) {
      const p = intPairs[order[k]];
      const negs = drawNegatives(negativeTable, negativeSamples, p.center, rand);
      lossSum += trainStep(model, p.center, p.context, negs, lr);
    }
    finalLoss = lossSum / Math.max(1, order.length);
    epochsRun++;

    // L2 drift vs previous snapshot.
    const drift = rmsDrift(prevSnapshot, model.inputEmbeddings);
    finalDrift = drift;
    prevSnapshot = new Float64Array(model.inputEmbeddings);

    if (epoch > 0 && drift < convergenceTolerance) {
      break;
    }
  }

  return {
    model,
    vocabulary,
    vocabIndex,
    counts: countsMap,
    epochsRun,
    finalLoss,
    finalDrift,
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Root-mean-square of per-element differences. */
export function rmsDrift(a: Float64Array, b: Float64Array): number {
  if (a.length !== b.length) {
    throw new Error(`rmsDrift length mismatch: ${a.length} vs ${b.length}`);
  }
  if (a.length === 0) return 0;
  let s = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    s += d * d;
  }
  return Math.sqrt(s / a.length);
}

/**
 * MD-1 Shallow Learned Embeddings — skip-gram with negative sampling.
 *
 * Pure-TypeScript implementation of a word2vec-style skip-gram model
 * (Mikolov et al., 2013, "Distributed Representations of Words and Phrases
 * and their Compositionality"). Hand-rolled matrix ops; no external numerics
 * library.
 *
 * The model stores two embedding matrices:
 *
 *   - `inputEmbeddings[vocabId][dim]`  — center-word vectors (the "output"
 *     embeddings operators read via api.ts)
 *   - `outputEmbeddings[vocabId][dim]` — context-word vectors used only by
 *     the training loop
 *
 * One training step consumes a single (center, context) positive pair plus
 * `negativeSamples` draws from the negative table. The update is the
 * standard skip-gram-with-negative-sampling (SGNS) SGD step:
 *
 *   loss = -log σ(v_in(c) · v_out(o))
 *          - Σ_k log σ(-v_in(c) · v_out(neg_k))
 *
 *   ∂loss/∂v_in(c)  = (σ(v_in(c)·v_out(o)) - 1) v_out(o)
 *                   + Σ_k σ(v_in(c)·v_out(neg_k)) v_out(neg_k)
 *   ∂loss/∂v_out(o) = (σ(v_in(c)·v_out(o)) - 1) v_in(c)
 *   ∂loss/∂v_out(neg_k) = σ(v_in(c)·v_out(neg_k)) v_in(c)
 *
 * The loss monotonically decreases on positive-only single-step updates
 * (validated in skip-gram.test.ts SGD monotonicity fixture).
 *
 * Determinism: all randomness flows through an injected RNG (Mulberry32 via
 * `trainer.ts`). Identical seed → identical weights.
 *
 * @module embeddings/skip-gram
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SkipGramModel {
  /** Vocabulary size. */
  vocabSize: number;
  /** Embedding dimension. */
  dim: number;
  /**
   * Input (center) embedding matrix, laid out as a single Float64Array of
   * length `vocabSize * dim`. Row-major: entity i occupies indices
   * `[i*dim, (i+1)*dim)`.
   */
  inputEmbeddings: Float64Array;
  /**
   * Output (context) embedding matrix, same layout. Not exposed to
   * consumers; used only during training. Reset per retrain.
   */
  outputEmbeddings: Float64Array;
}

// ─── Construction ───────────────────────────────────────────────────────────

/**
 * Create a freshly-initialised skip-gram model. Input embeddings are
 * sampled from a small uniform distribution `[-0.5/dim, +0.5/dim]`, matching
 * the word2vec reference. Output embeddings are initialised to zero, also
 * matching the reference.
 */
export function createSkipGramModel(
  vocabSize: number,
  dim: number,
  rand: () => number,
): SkipGramModel {
  if (vocabSize <= 0) throw new Error('vocabSize must be positive');
  if (dim <= 0) throw new Error('dim must be positive');

  const total = vocabSize * dim;
  const input = new Float64Array(total);
  const output = new Float64Array(total);
  const scale = 0.5 / dim;
  for (let i = 0; i < total; i++) {
    input[i] = (rand() - 0.5) * 2 * scale;
  }
  // output stays zero-initialised
  return {
    vocabSize,
    dim,
    inputEmbeddings: input,
    outputEmbeddings: output,
  };
}

// ─── Numeric helpers ────────────────────────────────────────────────────────

/**
 * Numerically-stable sigmoid. Clamps |x| ≤ 30 before exp to avoid overflow.
 */
export function sigmoid(x: number): number {
  if (x >= 30) return 1;
  if (x <= -30) return 0;
  return 1 / (1 + Math.exp(-x));
}

/**
 * Dot product of row `i` of matrix A with row `j` of matrix B. Both matrices
 * are assumed to be `dim` columns wide, row-major.
 */
export function dotRows(
  a: Float64Array,
  i: number,
  b: Float64Array,
  j: number,
  dim: number,
): number {
  const aStart = i * dim;
  const bStart = j * dim;
  let s = 0;
  for (let k = 0; k < dim; k++) {
    s += a[aStart + k] * b[bStart + k];
  }
  return s;
}

// ─── Single-pair SGD update ─────────────────────────────────────────────────

/**
 * Apply one SGNS SGD update for a single (center, context) positive pair
 * with the supplied negative sample ids. All ids must be in [0, vocabSize).
 *
 * Returns the scalar loss *before* the update, useful for monotone-decrease
 * tests and logging.
 */
export function trainStep(
  model: SkipGramModel,
  centerId: number,
  contextId: number,
  negativeIds: readonly number[],
  learningRate: number,
): number {
  const { dim, inputEmbeddings: vin, outputEmbeddings: vout, vocabSize } = model;
  if (centerId < 0 || centerId >= vocabSize) {
    throw new Error(`centerId out of range: ${centerId}`);
  }
  if (contextId < 0 || contextId >= vocabSize) {
    throw new Error(`contextId out of range: ${contextId}`);
  }

  const cBase = centerId * dim;

  // Accumulate gradient for v_in(center). We need to update v_out entries
  // BEFORE we've fully computed v_in's gradient, but we must use the OLD
  // v_in throughout (else the output grads would see the partially-updated
  // center vector). Strategy: compute sigmoid scalars and buffer the v_in
  // gradient, then apply v_out updates using the old v_in, then update v_in.
  const gradIn = new Float64Array(dim);

  // Positive pair.
  const posScore = dotRows(vin, centerId, vout, contextId, dim);
  const posSig = sigmoid(posScore);
  const posErr = posSig - 1; // dσ/dz term for label=1
  for (let k = 0; k < dim; k++) {
    gradIn[k] += posErr * vout[contextId * dim + k];
  }
  let loss = -Math.log(Math.max(posSig, 1e-12));

  // Negative samples.
  const negErrs = new Float64Array(negativeIds.length);
  for (let n = 0; n < negativeIds.length; n++) {
    const negId = negativeIds[n];
    if (negId < 0 || negId >= vocabSize) {
      throw new Error(`negativeId out of range: ${negId}`);
    }
    const negScore = dotRows(vin, centerId, vout, negId, dim);
    const negSig = sigmoid(negScore);
    negErrs[n] = negSig; // dσ/dz for label=0
    for (let k = 0; k < dim; k++) {
      gradIn[k] += negSig * vout[negId * dim + k];
    }
    loss += -Math.log(Math.max(1 - negSig, 1e-12));
  }

  // Apply v_out updates (use OLD v_in throughout — cBase offsets into vin).
  for (let k = 0; k < dim; k++) {
    vout[contextId * dim + k] -= learningRate * posErr * vin[cBase + k];
  }
  for (let n = 0; n < negativeIds.length; n++) {
    const negId = negativeIds[n];
    const offs = negId * dim;
    const e = negErrs[n];
    for (let k = 0; k < dim; k++) {
      vout[offs + k] -= learningRate * e * vin[cBase + k];
    }
  }

  // Apply v_in update.
  for (let k = 0; k < dim; k++) {
    vin[cBase + k] -= learningRate * gradIn[k];
  }

  return loss;
}

// ─── Loss evaluation (no update) ────────────────────────────────────────────

/**
 * Compute the SGNS loss for a single (center, context, negatives) tuple
 * without mutating any weights. Used by tests to verify monotone decrease
 * across SGD steps.
 */
export function evalLoss(
  model: SkipGramModel,
  centerId: number,
  contextId: number,
  negativeIds: readonly number[],
): number {
  const { dim, inputEmbeddings: vin, outputEmbeddings: vout } = model;
  const posScore = dotRows(vin, centerId, vout, contextId, dim);
  const posSig = sigmoid(posScore);
  let loss = -Math.log(Math.max(posSig, 1e-12));
  for (const negId of negativeIds) {
    const negScore = dotRows(vin, centerId, vout, negId, dim);
    const negSig = sigmoid(negScore);
    loss += -Math.log(Math.max(1 - negSig, 1e-12));
  }
  return loss;
}

// ─── Row accessors ──────────────────────────────────────────────────────────

/**
 * Extract a copy of the input-embedding row for `vocabId` as a plain number
 * array (useful across API boundaries that don't want typed arrays).
 */
export function getInputRow(
  model: SkipGramModel,
  vocabId: number,
): number[] {
  if (vocabId < 0 || vocabId >= model.vocabSize) {
    throw new Error(`vocabId out of range: ${vocabId}`);
  }
  const out = new Array<number>(model.dim);
  const base = vocabId * model.dim;
  for (let k = 0; k < model.dim; k++) out[k] = model.inputEmbeddings[base + k];
  return out;
}

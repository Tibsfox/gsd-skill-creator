/**
 * ArtifactNet Provenance — type definitions.
 *
 * Forensic-residual-physics provenance layer for skill/asset authenticity per
 * ArtifactNet (arXiv:2604.16254 / Heewon Oh et al., SONICS 3-way at n=23,288).
 *
 * UIP-20 T2d, Phase 772, CAPCOM hard-preservation Gate G13.
 *
 * All types are pure data. No I/O, no CAPCOM interaction, no skill-DAG
 * mutation. Provenance is a leaf observer that runs as a pre-audit step.
 *
 * @module artifactnet-provenance/types
 */

/**
 * Asset kind. Determines which residual detector(s) apply.
 *
 * - `text`: prose, source code, markdown, JSON.
 * - `audio`: WAV/PCM samples or any sequenced amplitude stream.
 * - `image`: pixel grid (greyscale or RGB).
 */
export type AssetKind = 'text' | 'audio' | 'image';

/**
 * Provenance verdict. Three-way per SONICS plus an `unknown` lane for the
 * default-off / fail-open passthrough.
 *
 * - `real`: forensic residuals consistent with human/non-AI authorship.
 * - `synthetic`: residuals consistent with full AI generation.
 * - `partial`: mixed signals — likely AI-touched but not fully synthetic
 *   (e.g. AI-edited human-authored text, AI-mixed real audio).
 * - `unknown`: detector did not run, was disabled, or could not classify.
 */
export type ProvenanceVerdict = 'real' | 'synthetic' | 'partial' | 'unknown';

/**
 * A single asset under provenance verification. Content is held in-memory as
 * a `Uint8Array` for binary kinds (audio/image) or as a string for text.
 *
 * The provenance layer is read-only over `Asset`. It MUST NOT mutate.
 */
export interface Asset {
  /** Stable identifier (e.g. content-hash, Grove record id, file path). */
  readonly id: string;
  /** Asset kind — drives detector selection. */
  readonly kind: AssetKind;
  /**
   * Asset content. Strings for text; for audio we accept either a numeric
   * sample array or raw bytes; for images, raw bytes.
   */
  readonly content: string | ReadonlyArray<number> | Uint8Array;
  /** Optional metadata (e.g. claimed author, capture device, sample rate). */
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/**
 * A residual signature: the structural fingerprint extracted from an asset
 * that the SONICS-style classifier consumes.
 *
 * Each field is a normalised statistic in [0, 1] unless otherwise noted, so
 * downstream classifiers can compose without rescaling.
 */
export interface ResidualSignature {
  /** Normalised entropy of n-gram / token / sample distribution. */
  readonly entropy: number;
  /** Burstiness / variance ratio — low = regular, high = bursty natural. */
  readonly burstiness: number;
  /**
   * Spectral flatness / harmonic-residual ratio for audio; for text, this
   * doubles as the rank-frequency Zipf-deviation coefficient. [0, 1].
   */
  readonly spectralFlatness: number;
  /**
   * Repetition coefficient: fraction of n-grams (or repeated samples) that
   * dominate the distribution. AI text is often noticeably more repetitive
   * at fine grain. [0, 1].
   */
  readonly repetition: number;
  /** Asset kind the signature was extracted from. */
  readonly kind: AssetKind;
}

/**
 * The output of `verifyProvenance()`. Always JSON-serialisable.
 */
export interface ProvenanceFinding {
  /** Asset identifier this finding is about. */
  readonly assetId: string;
  /** Three-way SONICS verdict. */
  readonly verdict: ProvenanceVerdict;
  /** Confidence in [0, 1]. Higher = stronger signal. */
  readonly confidence: number;
  /** Residual signature that produced the verdict. */
  readonly signature: ResidualSignature;
  /** True iff the layer ran in disabled / passthrough mode. */
  readonly disabled: boolean;
  /** Short human-readable explanation. */
  readonly message: string;
}

/**
 * Shape of the existing audit pipeline's report. We model it structurally
 * (duck-typed) rather than importing `AuditReport` from `src/skilldex-auditor`,
 * because Gate G13 forbids us from coupling that module's runtime contract.
 *
 * Type-only references to skilldex-auditor's `AuditReport` are permitted via
 * `import type` if downstream consumers want stronger typing — the structural
 * shape is intentionally a subset that matches.
 */
export interface ExistingAudit {
  readonly timestamp: string;
  readonly inspected: number;
  readonly findings: ReadonlyArray<unknown>;
  readonly disabled: boolean;
  readonly summary: Readonly<{ pass: number; warn: number; fail: number }>;
  /**
   * Optional pre-audit findings the provenance hook prepends. Always a fresh
   * array; the original `findings` list is never mutated.
   */
  readonly preAudit?: ReadonlyArray<ProvenanceFinding>;
}

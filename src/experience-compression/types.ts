/**
 * Experience Compression — type definitions.
 *
 * Based on the Experience Compression Spectrum formalism in
 * Zhang et al. (arXiv:2604.15877, §2 compression-axis formalism).
 *
 * The paper establishes that memory, skills, and rules are not qualitatively
 * distinct artifact types but points on a single compression axis relative to
 * raw interaction trace. The three canonical levels are:
 *
 *   - episodic   : 5–20×   compression (low end; near-raw event records)
 *   - procedural : 50–500× compression (mid band; skill / pattern representations)
 *   - declarative: 1000×+  compression (high end; rule-form distillations)
 *
 * The "missing diagonal" identified by Zhang et al. §4 is cross-level adaptive
 * compression: migration of experience across the episodic/procedural/declarative
 * boundary as context density grows. This module implements that missing diagonal.
 *
 * All types are pure data. No side effects, no I/O.
 *
 * @module experience-compression/types
 */

/** The three canonical levels of the compression spectrum (Zhang et al. §2). */
export type CompressionLevel = 'episodic' | 'procedural' | 'declarative';

/**
 * A single unit of raw experience that may be compressed.
 *
 * The `payload` field carries the semantic content in any serialisable form.
 * `byteSize` is the uncompressed byte count of the payload (used for ratio
 * measurement). `tags` carry optional metadata that influences level
 * classification (e.g. 'high-variability', 'structural-pattern').
 */
export interface ExperienceContent {
  /** Human-readable identifier for this experience record. */
  readonly id: string;
  /** The raw semantic payload (serialisable object or string). */
  readonly payload: unknown;
  /**
   * Uncompressed byte size of the payload.  Callers MUST supply a positive
   * integer; the classifier uses this as the denominator for ratio computation.
   */
  readonly byteSize: number;
  /**
   * Optional variability score in [0, 1]. High variability → episodic tier.
   * Low variability + structural regularity → procedural or declarative tier.
   * When absent the classifier derives a proxy from payload shape.
   */
  readonly variabilityScore?: number;
  /**
   * Optional abstraction depth (non-negative integer).
   * 0 = raw event record. 1-2 = pattern / procedure. 3+ = rule form.
   */
  readonly abstractionDepth?: number;
  /**
   * Optional hint tags.  Recognised values: 'episodic', 'procedural',
   * 'declarative', 'high-variability', 'structural-pattern', 'rule-form'.
   */
  readonly tags?: ReadonlyArray<string>;
}

/**
 * A record produced by compression.
 *
 * When the module is disabled (`settings.enabled === false`) the record is
 * returned verbatim with `{ disabled: true }` and the compressedByteSize equal
 * to the original byteSize (ratio === 1, byte-identical semantics).
 */
export interface CompressedRecord {
  /** Source experience ID. */
  readonly sourceId: string;
  /** Compression level applied. */
  readonly level: CompressionLevel;
  /**
   * Compressed payload.  For the disabled path this equals the original payload.
   * For the episodic path this is a structurally normalised copy.
   * For procedural/declarative this is an extracted pattern/rule representation.
   */
  readonly compressedPayload: unknown;
  /** Byte size of the compressed payload. */
  readonly compressedByteSize: number;
  /** Original byte size (copy from ExperienceContent.byteSize). */
  readonly originalByteSize: number;
  /** Achieved compression ratio (originalByteSize / compressedByteSize). */
  readonly ratio: CompressionRatio;
  /**
   * When true, the module was disabled at call time.  The payload is the
   * original content unchanged; ratio is 1.0.
   */
  readonly disabled?: true;
  /**
   * Timestamp of compression (ISO-8601).
   */
  readonly timestamp: string;
}

/**
 * A compression ratio value: originalByteSize / compressedByteSize.
 *
 * Guaranteed to be ≥ 1.0 for all valid outputs (compression never expands).
 * For the disabled path the ratio is exactly 1.0.
 */
export type CompressionRatio = number;

/**
 * Result of classifyLevel.
 *
 * Carries the classified level, a confidence score in (0, 1], and the
 * heuristic signals that drove the classification decision.
 */
export interface ClassificationResult {
  readonly level: CompressionLevel;
  /** Confidence in [0, 1]. */
  readonly confidence: number;
  /** Heuristic signals used (informational; not part of the stable API). */
  readonly signals: {
    readonly variability: number;
    readonly structuralRegularity: number;
    readonly abstractionDepth: number;
  };
}

/**
 * Result of cross-level bridge compression (the "missing diagonal").
 *
 * Carries compressed records at all levels the content admits, keyed by level.
 * At minimum the canonical level is present; adjacent levels are present when
 * the content can be framed at the alternative level.
 */
export interface CrossLevelResult {
  /** The level the classifier assigned to the input. */
  readonly canonicalLevel: CompressionLevel;
  /**
   * Compressed records at each admitted level.
   * Always includes the canonical level.
   * Adjacent-level entries are present when the content admits the framing.
   */
  readonly records: Partial<Record<CompressionLevel, CompressedRecord>>;
  /**
   * Levels that were generated beyond the canonical level (the "missing diagonal"
   * entries per Zhang et al. §4).
   */
  readonly diagonalLevels: ReadonlyArray<CompressionLevel>;
}

/**
 * Memory Sink — the knowledge spine's write path.
 *
 * The first real ObservationSink that turns mined learning patterns into
 * recallable memories. Learner observations are buffered as they arrive; on
 * `flush()` the buffer is run through a LearningPatternDetector and every
 * promotable pattern is written into the MemoryService as a 'lesson' memory,
 * making it semantically searchable alongside the rest of the memory corpus.
 *
 * HARD BOUNDARY: this path NEVER modifies a skill, agent, or any on-disk
 * artifact. A mined pattern only ever becomes a recallable memory record —
 * promotion to an actual skill remains a separate, human-gated decision.
 *
 * The write goes through `MemoryService.store()`, which owns embedding at the
 * vector tiers (LOD 350 Chroma / LOD 400 pgvector, both 384-dim to match the
 * BGE-small-en column). This module produces the record; it does not embed.
 */

import { createHash } from 'node:crypto';
import type { LearnerObservation } from './observation-types.js';
import type {
  LearningPattern,
  LearningPatternSuggestion,
} from './learning-pattern-detector.js';
import type { ObservationSink } from './observation-hooks.js';
import type { MemoryRecord } from '../memory/types.js';

/**
 * Minimal write surface the sink needs. `MemoryService` satisfies this
 * structurally, so callers pass a real service without this module importing
 * the concrete class.
 */
export interface PatternMemoryWriter {
  store(record: MemoryRecord): Promise<MemoryRecord>;
}

/**
 * Minimal detection surface the sink needs. `LearningPatternDetector`
 * satisfies this structurally.
 */
export interface PatternDetector {
  suggest(observations: LearnerObservation[]): LearningPatternSuggestion[];
}

export interface MemorySinkOptions {
  /**
   * Extra confidence gate applied on top of the detector's own
   * `minConfidence`. Only patterns at or above this are promoted. Default 0.
   */
  minConfidence?: number;

  /**
   * When true, each observation triggers a fire-and-forget `flush()`. Default
   * false — callers flush explicitly (e.g. at a phase boundary) so storage
   * cost is bounded and deterministic.
   */
  autoFlush?: boolean;

  /** Invoked with any error thrown during an auto-flush. */
  onError?: (error: unknown) => void;
}

/** Namespace UUID for deriving stable memory IDs from pattern IDs. */
const PATTERN_MEMORY_NAMESPACE = 'a5f3c2e1-0000-5000-8000-6d656d6f7279';

/**
 * Derive a stable, valid v5-shaped UUID from a key so re-flushing the same
 * pattern overwrites its memory rather than duplicating it (idempotent).
 */
function deterministicId(key: string): string {
  const h = createHash('sha1')
    .update(PATTERN_MEMORY_NAMESPACE)
    .update(key)
    .digest('hex');
  const variant = ((parseInt(h.slice(16, 17), 16) & 0x3) | 0x8).toString(16);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-${variant}${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

/**
 * Convert a mined learning pattern into a recallable memory record.
 *
 * Pure: given the same pattern it yields the same record (stable id, no clock
 * read beyond timestamps). The record is a 'lesson' — durable, internal,
 * scoped to the domains (packs) the pattern was observed in.
 */
export function patternToMemoryRecord(
  pattern: LearningPattern | LearningPatternSuggestion,
): MemoryRecord {
  const now = new Date();
  const suggestion = 'suggestedDescription' in pattern ? pattern : undefined;

  const name = suggestion?.suggestedSkillName ?? pattern.id;
  const description = suggestion?.suggestedDescription ?? pattern.description;

  const contentLines = [
    pattern.description,
    '',
    `Pattern type: ${pattern.type}`,
    `Evidence count: ${pattern.evidenceCount}`,
    `Confidence: ${pattern.confidence.toFixed(3)}`,
    `Observed in packs: ${pattern.packIds.join(', ')}`,
  ];

  return {
    id: deterministicId(pattern.id),
    type: 'lesson',
    name,
    description,
    content: contentLines.join('\n'),
    lodCurrent: 300,
    tags: ['learning-pattern', `pattern:${pattern.type}`],
    confidence: pattern.confidence,
    validFrom: now,
    validTo: null,
    createdAt: now,
    updatedAt: now,
    lastAccessed: now,
    accessCount: 0,
    provenance: {
      scope: 'domain',
      visibility: 'internal',
      domains: [...pattern.packIds],
    },
    temporalClass: 'durable',
    relatedTo: [],
  };
}

/**
 * Buffers learner observations and promotes mined patterns into memory.
 *
 * Register `sink` with an `ObservationEmitter.addSink()`; call `flush()` to
 * run detection and persist promotable patterns.
 */
export class MemorySink {
  private readonly buffer: LearnerObservation[] = [];

  constructor(
    private readonly writer: PatternMemoryWriter,
    private readonly detector: PatternDetector,
    private readonly options: MemorySinkOptions = {},
  ) {}

  /** The ObservationSink function to register with an ObservationEmitter. */
  readonly sink: ObservationSink = (observation: LearnerObservation): void => {
    this.buffer.push(observation);
    if (this.options.autoFlush) {
      void this.flush().catch((error) => this.options.onError?.(error));
    }
  };

  /** Number of observations buffered but not yet flushed. */
  get pending(): number {
    return this.buffer.length;
  }

  /** Drop buffered observations without persisting. */
  clear(): void {
    this.buffer.length = 0;
  }

  /**
   * Run the detector over buffered observations and store every promotable
   * pattern as a 'lesson' memory. Returns the stored records.
   */
  async flush(): Promise<MemoryRecord[]> {
    if (this.buffer.length === 0) return [];

    const suggestions = this.detector.suggest([...this.buffer]);
    const minConfidence = this.options.minConfidence ?? 0;
    const promotable = suggestions.filter((s) => s.confidence >= minConfidence);

    const stored: MemoryRecord[] = [];
    for (const pattern of promotable) {
      stored.push(await this.writer.store(patternToMemoryRecord(pattern)));
    }
    return stored;
  }
}

/**
 * Factory for a MemorySink. Opt-in wiring: nothing constructs this by default,
 * so registering the knowledge spine's memory write path is an explicit call —
 * default runtime behavior (and DB requirements) are unchanged until a caller
 * builds one.
 */
export function createMemorySink(
  writer: PatternMemoryWriter,
  detector: PatternDetector,
  options?: MemorySinkOptions,
): MemorySink {
  return new MemorySink(writer, detector, options);
}

/**
 * Dev Memory Sink — the dev-domain write path into the Knowledge Spine.
 *
 * The dev-domain sibling of {@link ./memory-sink.ts}. It buffers
 * {@link DevSessionObservation}s, runs them through a {@link DevPatternDetector}
 * on `flush()`, and writes each promotable pattern into the MemoryService as an
 * honest `episodic` (session facts) or `feedback` (corrections) record —
 * **never** a `lesson`, and never with learner/pack/mastery vocabulary.
 *
 * HARD BOUNDARY (inherited from MemorySink): this path NEVER modifies a skill,
 * agent, or any on-disk artifact. A mined pattern only ever becomes a recallable
 * memory record through the injected {@link PatternMemoryWriter.store}.
 *
 * CORRECTIONS ARE QUARANTINE-GATED: correction-cluster patterns are NOT written
 * by default. Auto-attributing corrections is disallowed (item-7 policy); a
 * caller must explicitly opt in (`includeCorrections`), which is the human-gated
 * decision that stands in for acceptance here.
 *
 * @module knowledge/dev-memory-sink
 */

import { createHash } from 'node:crypto';
import type { MemoryRecord, MemoryType } from '../memory/types.js';
import type { PatternMemoryWriter } from './memory-sink.js';
import {
  DevPatternDetector,
  type DevPattern,
  type DevPatternDetectorOptions,
} from './dev-pattern-detector.js';
import type { DevSessionObservation } from './dev-observation-types.js';

/** Minimal detection surface the sink needs. `DevPatternDetector` satisfies this. */
export interface DevPatternSource {
  detect(observations: DevSessionObservation[]): DevPattern[];
}

/** Namespace UUID for deriving stable dev-memory IDs — distinct from the education namespace. */
const DEV_PATTERN_MEMORY_NAMESPACE = 'd57a1c33-0000-5000-8000-6465766d656d';

/** Derive a stable, valid v5-shaped UUID from a dev-pattern id (idempotent overwrite). */
function devDeterministicId(key: string): string {
  const h = createHash('sha1').update(DEV_PATTERN_MEMORY_NAMESPACE).update(key).digest('hex');
  const variant = ((parseInt(h.slice(16, 17), 16) & 0x3) | 0x8).toString(16);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-${variant}${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

/**
 * Convert a mined dev pattern into a recallable memory record. Correction
 * clusters become `feedback`; everything else becomes `episodic`. Scoped to the
 * project, internal visibility, seasonal decay (active project context).
 */
export function devPatternToMemoryRecord(pattern: DevPattern): MemoryRecord {
  const now = new Date();
  const type: MemoryType = pattern.type === 'correction-cluster' ? 'feedback' : 'episodic';

  const content = [
    pattern.description,
    '',
    `Pattern type: dev-${pattern.type}`,
    `Evidence count: ${pattern.evidenceCount}`,
    `Confidence: ${pattern.confidence.toFixed(3)}`,
    `Repos: ${pattern.repos.join(', ')}`,
  ].join('\n');

  return {
    id: devDeterministicId(pattern.id),
    type,
    name: `dev-${pattern.type}`,
    description: pattern.description.slice(0, 150),
    content,
    lodCurrent: 300,
    tags: ['dev-session', `pattern:dev-${pattern.type}`],
    confidence: pattern.confidence,
    validFrom: now,
    validTo: null,
    createdAt: now,
    updatedAt: now,
    lastAccessed: now,
    accessCount: 0,
    provenance: {
      scope: 'project',
      visibility: 'internal',
      project: 'gsd-skill-creator',
      domains: [...pattern.repos],
    },
    temporalClass: 'seasonal',
    relatedTo: [],
  };
}

export interface DevMemorySinkOptions {
  /** Only patterns at or above this confidence are promoted. Default 0. */
  minConfidence?: number;
  /**
   * Opt in to writing correction-cluster patterns as `feedback` memories.
   * Default false — corrections are QUARANTINE-gated (item-7); auto-attribution
   * is disallowed, so promotion is an explicit human-gated choice.
   */
  includeCorrections?: boolean;
}

/**
 * Buffers dev-session observations and promotes mined dev patterns into memory.
 * Unlike MemorySink this is NOT an ObservationEmitter sink — dev sessions are
 * intentionally kept off the education emitter; the caller flushes explicitly.
 */
export class DevMemorySink {
  private readonly buffer: DevSessionObservation[] = [];

  constructor(
    private readonly writer: PatternMemoryWriter,
    private readonly detector: DevPatternSource,
    private readonly options: DevMemorySinkOptions = {},
  ) {}

  /** Buffer one observation. */
  add(observation: DevSessionObservation): void {
    this.buffer.push(observation);
  }

  /** Buffer many observations. */
  addMany(observations: DevSessionObservation[]): void {
    this.buffer.push(...observations);
  }

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
   * pattern. Correction clusters are excluded unless `includeCorrections`.
   */
  async flush(): Promise<MemoryRecord[]> {
    if (this.buffer.length === 0) return [];

    const minConfidence = this.options.minConfidence ?? 0;
    const includeCorrections = this.options.includeCorrections ?? false;
    const promotable = this.detector
      .detect([...this.buffer])
      .filter(
        (p) =>
          p.confidence >= minConfidence &&
          (includeCorrections || p.type !== 'correction-cluster'),
      );

    const stored: MemoryRecord[] = [];
    for (const pattern of promotable) {
      stored.push(await this.writer.store(devPatternToMemoryRecord(pattern)));
    }
    return stored;
  }
}

/**
 * Factory for a DevMemorySink. Opt-in wiring: nothing constructs this by
 * default, so registering the dev-domain memory write path is an explicit call.
 * Detector thresholds and sink options are supplied together for caller
 * convenience.
 */
export function createDevMemorySink(
  writer: PatternMemoryWriter,
  options: DevMemorySinkOptions & DevPatternDetectorOptions = {},
): DevMemorySink {
  const detector = new DevPatternDetector({
    minRecurrence: options.minRecurrence,
    minSequence: options.minSequence,
    smoothingK: options.smoothingK,
  });
  return new DevMemorySink(writer, detector, {
    minConfidence: options.minConfidence,
    includeCorrections: options.includeCorrections,
  });
}

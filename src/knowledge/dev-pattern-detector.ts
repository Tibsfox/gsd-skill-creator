/**
 * Dev-Session Pattern Detector.
 *
 * The dev-domain sibling of {@link ./learning-pattern-detector.ts}. It mines
 * recurrences in a batch of {@link DevSessionObservation}s and emits
 * {@link DevPattern}s worth remembering across sessions — recurring friction on
 * a file/command, correction clusters, recurring capability gaps, and repeated
 * tool sequences.
 *
 * Deliberately NOT the education detector: confidence is occurrence-count based
 * (no score, no rubric, no mastery), sparse input emits nothing, and no
 * description ever uses learner/pack/mastery vocabulary. Pure and deterministic:
 * given the same observations it yields the same patterns with stable ids, so
 * re-running idempotently updates rather than duplicates downstream memories.
 *
 * @module knowledge/dev-pattern-detector
 */

import { createHash } from 'node:crypto';
import type { DevSessionObservation } from './dev-observation-types.js';

export type DevPatternType =
  | 'recurring-friction'
  | 'correction-cluster'
  | 'recurring-gap'
  | 'tool-sequence';

export interface DevPattern {
  /** Stable, content-derived id keyed on (type, group key) — NOT on evidence count. */
  readonly id: string;
  readonly type: DevPatternType;
  /** Dev-vocabulary description — never learner/pack/mastery language. */
  readonly description: string;
  /** Distinct repos the supporting observations came from. */
  readonly repos: string[];
  /** How many observations support the pattern. */
  readonly evidenceCount: number;
  /** Occurrence-count-based confidence in [0,1]. */
  readonly confidence: number;
  /** Structured evidence (file/command/missing/sequence) for the memory writer. */
  readonly details: Record<string, unknown>;
}

export interface DevPatternDetectorOptions {
  /** Min occurrences for friction/correction/gap to count as a pattern. Default 2. */
  readonly minRecurrence?: number;
  /** Min repeats for a tool bigram to count as a sequence pattern. Default 3. */
  readonly minSequence?: number;
  /** Smoothing constant in confidence = count/(count+k). Default 3. */
  readonly smoothingK?: number;
}

function patternId(type: string, key: string): string {
  const h = createHash('sha1').update(`${type}\x00${key}`).digest('hex');
  return `dev-pattern-${h.slice(0, 16)}`;
}

interface Group {
  key: string;
  members: DevSessionObservation[];
}

/** Group observations of one kind by a derived sub-key, dropping keyless members. */
function groupBy(
  observations: DevSessionObservation[],
  kind: DevSessionObservation['kind'],
  keyOf: (o: DevSessionObservation) => string | undefined,
): Group[] {
  const map = new Map<string, DevSessionObservation[]>();
  for (const o of observations) {
    if (o.kind !== kind) continue;
    const key = keyOf(o);
    if (!key) continue;
    const bucket = map.get(key) ?? [];
    bucket.push(o);
    map.set(key, bucket);
  }
  return [...map.entries()].map(([key, members]) => ({ key, members }));
}

function reposOf(members: DevSessionObservation[]): string[] {
  return [...new Set(members.map((m) => m.repo))].sort();
}

export class DevPatternDetector {
  private readonly minRecurrence: number;
  private readonly minSequence: number;
  private readonly smoothingK: number;

  constructor(options: DevPatternDetectorOptions = {}) {
    this.minRecurrence = options.minRecurrence ?? 2;
    this.minSequence = options.minSequence ?? 3;
    this.smoothingK = options.smoothingK ?? 3;
  }

  /** Occurrence-count confidence: monotonic, bounded in (0,1). */
  private confidence(count: number): number {
    return count / (count + this.smoothingK);
  }

  /**
   * Mine `observations` for dev patterns. Returns patterns sorted by id for
   * deterministic output; an empty array when nothing clears the thresholds.
   */
  detect(observations: DevSessionObservation[]): DevPattern[] {
    const out: DevPattern[] = [];

    // Recurring friction on the same file/command/summary.
    for (const g of groupBy(observations, 'friction', (o) =>
      o.kind === 'friction' ? o.file ?? o.command ?? o.summary : undefined,
    )) {
      if (g.members.length < this.minRecurrence) continue;
      out.push({
        id: patternId('recurring-friction', g.key),
        type: 'recurring-friction',
        description: `Recurring friction on "${g.key}" — ${g.members.length} occurrences`,
        repos: reposOf(g.members),
        evidenceCount: g.members.length,
        confidence: this.confidence(g.members.length),
        details: { key: g.key },
      });
    }

    // Correction clusters (by file, else a single session bucket).
    for (const g of groupBy(observations, 'correction', (o) =>
      o.kind === 'correction' ? o.file ?? '(session)' : undefined,
    )) {
      if (g.members.length < this.minRecurrence) continue;
      const where = g.key === '(session)' ? 'this session' : `"${g.key}"`;
      out.push({
        id: patternId('correction-cluster', g.key),
        type: 'correction-cluster',
        description: `Correction cluster on ${where} — ${g.members.length} corrections`,
        repos: reposOf(g.members),
        evidenceCount: g.members.length,
        confidence: this.confidence(g.members.length),
        details: { key: g.key },
      });
    }

    // Recurring capability gaps by missing name (else summary).
    for (const g of groupBy(observations, 'gap', (o) =>
      o.kind === 'gap' ? o.missing ?? o.summary : undefined,
    )) {
      if (g.members.length < this.minRecurrence) continue;
      out.push({
        id: patternId('recurring-gap', g.key),
        type: 'recurring-gap',
        description: `Recurring capability gap "${g.key}" surfaced ${g.members.length}×`,
        repos: reposOf(g.members),
        evidenceCount: g.members.length,
        confidence: this.confidence(g.members.length),
        details: { key: g.key },
      });
    }

    // Repeated adjacent tool bigrams over the tool_use stream.
    out.push(...this.detectToolSequences(observations));

    return out.sort((a, b) => a.id.localeCompare(b.id));
  }

  private detectToolSequences(observations: DevSessionObservation[]): DevPattern[] {
    const tools = observations
      .filter((o): o is Extract<DevSessionObservation, { kind: 'tool_use' }> => o.kind === 'tool_use')
      .map((o) => o.tool);
    const counts = new Map<string, number>();
    const repos = new Map<string, string[]>();
    const toolObs = observations.filter((o) => o.kind === 'tool_use');
    for (let i = 0; i + 1 < tools.length; i++) {
      const key = `${tools[i]}→${tools[i + 1]}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
      repos.set(key, [...new Set([...(repos.get(key) ?? []), toolObs[i]!.repo, toolObs[i + 1]!.repo])]);
    }
    const out: DevPattern[] = [];
    for (const [key, count] of counts) {
      if (count < this.minSequence) continue;
      out.push({
        id: patternId('tool-sequence', key),
        type: 'tool-sequence',
        description: `Repeated tool sequence ${key} (${count}×)`,
        repos: (repos.get(key) ?? []).sort(),
        evidenceCount: count,
        confidence: this.confidence(count),
        details: { sequence: key },
      });
    }
    return out;
  }
}

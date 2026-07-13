/**
 * Dev-memory orchestration entry — the opt-in seam that ties the dev-domain
 * pieces together: read the on-disk session streams, mine dev patterns, and
 * flush them into an injected memory writer.
 *
 * Nothing calls this by default. An operator-invoked caller (e.g. the
 * `flywheel dev-memory` verb, or a session-end hook) supplies the writer — a
 * real `MemoryService` to persist, or a collector for a dry run — so this
 * module never constructs storage and never writes by default.
 *
 * @module knowledge/dev-memory-run
 */

import type { MemoryRecord } from '../memory/types.js';
import type { PatternMemoryWriter } from './memory-sink.js';
import { readDevObservations, type DevSessionSummaryInput } from './dev-observation-source.js';
import { createDevMemorySink, type DevMemorySinkOptions } from './dev-memory-sink.js';
import type { DevPatternDetectorOptions } from './dev-pattern-detector.js';

export interface RunDevMemoryInput {
  /** Directory holding current.jsonl + current.tool-trace.jsonl (e.g. .planning/sessions). */
  readonly sessionsDir: string;
  readonly sessionId: string;
  readonly repo: string;
  /** Where mined patterns are written. A MemoryService satisfies this; so does a collector. */
  readonly writer: PatternMemoryWriter;
  readonly sessionSummary?: DevSessionSummaryInput;
  readonly options?: DevMemorySinkOptions & DevPatternDetectorOptions;
}

/**
 * Read the dev-session streams from `sessionsDir`, mine dev patterns, and flush
 * every promotable one through `writer`. Returns the stored records ([] when the
 * session has no streams or nothing clears the thresholds).
 */
export async function runDevMemory(input: RunDevMemoryInput): Promise<MemoryRecord[]> {
  const observations = await readDevObservations({
    sessionsDir: input.sessionsDir,
    sessionId: input.sessionId,
    repo: input.repo,
    sessionSummary: input.sessionSummary,
  });
  if (observations.length === 0) return [];

  const sink = createDevMemorySink(input.writer, input.options ?? {});
  sink.addMany(observations);
  return sink.flush();
}

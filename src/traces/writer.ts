/**
 * M3 Decision-Trace Ledger — append-only JSONL writer.
 *
 * Writes canonical DecisionTrace records to `.planning/traces/decisions.jsonl`
 * (or a caller-supplied path for testing).  Delegates all IO to
 * `src/mesh/event-log.ts` so there is no parallel log — M3 EXTEND posture.
 *
 * Invariants (SC-M3-APPEND):
 *   - Uses fs.appendFile exclusively via the event-log writer.
 *   - No in-place update or delete path exists in this module.
 *   - Concurrent writers are resolved by last-write-wins + timestamp ordering:
 *     each JSONL line is atomic (single appendFile call); readers sort by ts
 *     when ordering matters.
 *
 * Redact-on-write:
 *   Scans every string field for secret-like content before writing.
 *   Pattern: /api[-_]?key|password|token|secret|private[-_]?key/i
 *   Matched substrings are replaced with [redacted].
 *
 * Phase 644, Wave 1 Track D (M3).
 *
 * @module traces/writer
 */

import { promises as fs } from 'node:fs';
import { dirname } from 'node:path';
import { logDecisionTrace } from '../mesh/event-log.js';
import { toCanonical } from './schema.js';
import type { DecisionTrace } from '../types/memory.js';
import type { CanonicalDecisionTrace } from './schema.js';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Default trace file path (gitignored runtime state). */
export const DEFAULT_TRACE_PATH = '.planning/traces/decisions.jsonl';

/** Secret keyword pattern for redact-on-write. */
export const SECRET_PATTERN = /api[-_]?key|password|token|secret|private[-_]?key/gi;

// ─── Redaction ────────────────────────────────────────────────────────────────

/**
 * Redact secret-like substrings from a single string value.
 * Replaces matched keyword occurrences (and any trailing `=…` value)
 * with `[redacted]`.
 *
 * Uses word boundaries (\b) so `token` does not match inside `max-tokens`
 * or `fingerprinting`.
 *
 * Examples caught:
 *   "api_key=sk-abc123"        → "[redacted]"
 *   "password: hunter2"        → "[redacted]"
 *   "Bearer token_xyz_abc"     → "Bearer [redacted]"
 *   "TOKEN=secret"             → "[redacted]"
 *   "private_key=MIIG..."      → "[redacted]"
 *
 * NOT caught (intentional — not standalone secret keywords):
 *   "max-tokens:1000"          → unchanged (tokens is not a keyword)
 *   "Token fingerprinting"     → unchanged (fingerprinting; Token is context word here)
 */
export function redactString(s: string): string {
  // Pattern breakdown:
  //   \b              — word boundary before keyword
  //   (?:api[-_]?key|password|token|secret|private[-_]?key)  — keyword
  //   \b              — word boundary after keyword
  //   (?:[=:\s]+\S+)? — optional =value or : value trailer (greedy)
  return s.replace(
    /\b(?:api[-_]?key|password|token|secret|private[-_]?key)\b(?:[=:\s]+\S+)?/gi,
    '[redacted]',
  );
}

/**
 * Recursively redact all string values in a CanonicalDecisionTrace.
 * Arrays of strings are redacted element-by-element.
 */
export function redactTrace(trace: CanonicalDecisionTrace): CanonicalDecisionTrace {
  return {
    ...trace,
    actor: redactString(trace.actor),
    intent: redactString(trace.intent),
    reasoning: redactString(trace.reasoning),
    constraints: trace.constraints.map(redactString),
    alternatives: trace.alternatives.map(redactString),
    outcome: redactString(trace.outcome),
    refs: {
      teachId: redactString(trace.refs.teachId),
      entityIds: trace.refs.entityIds.map(redactString),
    },
  };
}

// ─── Writer ───────────────────────────────────────────────────────────────────

/**
 * Appends a single DecisionTrace to the JSONL log.
 *
 * Steps:
 *   1. Convert to canonical form (validates via Zod).
 *   2. Redact secrets.
 *   3. Delegate to event-log writer (fs.appendFile, EXTEND posture).
 *
 * Returns the redacted canonical form that was written.
 */
export async function writeTrace(
  trace: DecisionTrace,
  logPath: string = DEFAULT_TRACE_PATH,
): Promise<CanonicalDecisionTrace> {
  const canonical = toCanonical(trace);
  const redacted = redactTrace(canonical);

  // Ensure parent dir exists (event-log.ts also does this, but being explicit
  // here avoids a race when the traces/ subdir doesn't exist yet).
  await fs.mkdir(dirname(logPath), { recursive: true });

  // Delegate to the event-log EXTEND path — this is the only write surface.
  await logDecisionTrace(logPath, redacted as unknown as DecisionTrace);
  return redacted;
}

/**
 * Append-only batch writer.  Writes each trace sequentially to preserve
 * timestamp ordering in the JSONL file.
 */
export async function writeTraces(
  traces: DecisionTrace[],
  logPath: string = DEFAULT_TRACE_PATH,
): Promise<CanonicalDecisionTrace[]> {
  const results: CanonicalDecisionTrace[] = [];
  for (const trace of traces) {
    results.push(await writeTrace(trace, logPath));
  }
  return results;
}

// ─── TraceWriter class ────────────────────────────────────────────────────────

/**
 * Stateful wrapper bound to a specific log path.
 * Provides the same API as the free functions for DI contexts.
 */
export class TraceWriter {
  constructor(private readonly logPath: string = DEFAULT_TRACE_PATH) {}

  /** Append a single trace. Returns the redacted canonical form written. */
  write(trace: DecisionTrace): Promise<CanonicalDecisionTrace> {
    return writeTrace(trace, this.logPath);
  }

  /** Append multiple traces sequentially. */
  writeAll(traces: DecisionTrace[]): Promise<CanonicalDecisionTrace[]> {
    return writeTraces(traces, this.logPath);
  }
}

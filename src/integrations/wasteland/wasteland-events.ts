/**
 * wasteland-events — Emit wasteland activity signals onto the core event bus.
 *
 * R2.1: Makes wasteland operations observable to the rest of the skill-creator
 * system. Events follow the core category:action naming convention and are
 * stored in the JSONL event store alongside all other skill events.
 *
 * Events emitted:
 * - wasteland:scan-complete   — Dolt scanner finished a scan cycle
 * - wasteland:trust-escalation — Rig trust level changed
 * - wasteland:stamp-issued     — Stamp validator produced a recommendation
 * - wasteland:completion-submitted — Rig submitted completion evidence
 *
 * @module wasteland-events
 */

import { emitEvent } from '../../core/events/event-lifecycle.js';
import * as os from 'node:os';
import * as path from 'node:path';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EMITTER_NAME = 'wasteland-integration';

/** Default patterns directory — ~/.hop/events/ */
function defaultPatternsDir(): string {
  return path.join(os.homedir(), '.hop', 'events');
}

// ---------------------------------------------------------------------------
// Event types
// ---------------------------------------------------------------------------

export interface WastelandEventOptions {
  /** Override patterns directory (for test isolation). */
  patternsDir?: string;
  /** TTL in hours (default: 48 for wasteland events). */
  ttlHours?: number;
}

// ---------------------------------------------------------------------------
// Event emitters
// ---------------------------------------------------------------------------

/**
 * Emit when a Dolt scan cycle completes.
 */
export async function emitScanComplete(
  meta: { rigCount?: number; source?: string },
  options?: WastelandEventOptions,
): Promise<void> {
  await emitEvent(
    options?.patternsDir ?? defaultPatternsDir(),
    'wasteland:scan-complete',
    EMITTER_NAME,
    { ttlHours: options?.ttlHours ?? 48 },
  );
}

/**
 * Emit when a rig's trust level changes.
 */
export async function emitTrustEscalation(
  meta: { handle: string; fromLevel: number; toLevel: number },
  options?: WastelandEventOptions,
): Promise<void> {
  await emitEvent(
    options?.patternsDir ?? defaultPatternsDir(),
    'wasteland:trust-escalation',
    EMITTER_NAME,
    { ttlHours: options?.ttlHours ?? 48 },
  );
}

/**
 * Emit when the stamp validator produces a recommendation.
 */
export async function emitStampIssued(
  meta: { stampId: string; wantedId: string; handle: string },
  options?: WastelandEventOptions,
): Promise<void> {
  await emitEvent(
    options?.patternsDir ?? defaultPatternsDir(),
    'wasteland:stamp-issued',
    EMITTER_NAME,
    { ttlHours: options?.ttlHours ?? 48 },
  );
}

/**
 * Emit when a rig submits completion evidence via wl-done.
 */
export async function emitCompletionSubmitted(
  meta: { completionId: string; wantedId: string; handle: string },
  options?: WastelandEventOptions,
): Promise<void> {
  await emitEvent(
    options?.patternsDir ?? defaultPatternsDir(),
    'wasteland:completion-submitted',
    EMITTER_NAME,
    { ttlHours: options?.ttlHours ?? 48 },
  );
}

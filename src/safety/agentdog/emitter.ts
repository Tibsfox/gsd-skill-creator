/**
 * HB-02 AgentDoG — BLOCK-decision diagnostic emitter.
 *
 * Composes the Where/How/What axes into a single `AgentDogDiagnostic`
 * record alongside (NOT instead of) an existing Safety Warden BLOCK
 * decision.
 *
 * Default-off discipline: when the flag is off, returns a stable disabled
 * sentinel. The existing Safety Warden BLOCK emission is byte-identical
 * regardless.
 *
 * @module safety/agentdog/emitter
 */

import { isAgentDogEnabled } from './settings.js';
import { captureWhereAxis } from './where.js';
import { captureHowAxis } from './how.js';
import { captureWhatAxis } from './what.js';
import {
  AGENTDOG_SCHEMA_VERSION,
  type AgentDogDiagnostic,
  type AgentDogEmitResult,
  type BlockContext,
} from './types.js';

const DISABLED_RESULT: AgentDogEmitResult = Object.freeze({
  emitted: false,
  disabled: true,
  diagnostic: null,
});

/**
 * Emit an `AgentDogDiagnostic` for a Safety Warden BLOCK decision.
 *
 * - Flag off → returns the frozen disabled sentinel; no diagnostic
 *   produced; no side effect; BLOCK emission elsewhere is unchanged.
 * - Flag on → composes the three axes into a frozen diagnostic record
 *   that the caller can persist alongside the BLOCK record.
 *
 * @param context BLOCK context fields (all optional).
 * @param settingsPath Optional override for the JSON config path (tests).
 */
export function emitAgentDogDiagnostic(
  context: BlockContext,
  settingsPath?: string,
): AgentDogEmitResult {
  if (!isAgentDogEnabled(settingsPath)) {
    return DISABLED_RESULT;
  }
  const where = captureWhereAxis(context);
  const how = captureHowAxis(context);
  const what = captureWhatAxis(context);
  const diagnostic: AgentDogDiagnostic = Object.freeze({
    schemaVersion: AGENTDOG_SCHEMA_VERSION,
    where,
    how,
    what,
  });
  return Object.freeze({ emitted: true, disabled: false, diagnostic });
}

/**
 * Stable disabled-result sentinel exposed for tests and barrel callers.
 */
export const AGENTDOG_DISABLED_RESULT: AgentDogEmitResult = DISABLED_RESULT;

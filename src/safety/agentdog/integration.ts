/**
 * HB-02 AgentDoG — Safety Warden integration shim.
 *
 * The Safety Warden's existing BLOCK decision path is **unchanged**.
 * This shim is a *bystander*: existing BLOCK call-sites can choose to
 * call `enrichBlockWithAgentDog()` to attach a diagnostic record to the
 * BLOCK output object. With the flag off, the returned object is
 * referentially equal to the input — guaranteeing byte-identical
 * downstream serialization.
 *
 * Why a shim and not a direct hook? The Safety Warden BLOCK decision
 * logic must NOT take diagnostic enrichment as input — diagnostic is
 * derived from the BLOCK, never the cause of one. Keeping enrichment
 * on the *output* side makes the invariant structurally enforceable.
 *
 * @module safety/agentdog/integration
 */

import { emitAgentDogDiagnostic } from './emitter.js';
import type { AgentDogDiagnostic, BlockContext } from './types.js';

/**
 * Enrich a BLOCK output object with an AgentDoG diagnostic field.
 *
 * - Flag off → returns the input object **unchanged** (referentially
 *   equal). The flag-off-byte-identical test relies on this.
 * - Flag on → returns a new object that is `{ ...blockOutput, agentDog: <diagnostic> }`.
 *
 * The caller controls what `context` carries; this function never reads
 * from `blockOutput` to build context (BLOCK semantics are not the
 * source of truth for diagnostic axes).
 *
 * @param blockOutput The existing BLOCK output object from Safety Warden.
 * @param context BLOCK context fields used to derive the diagnostic.
 * @param settingsPath Optional override for the JSON config path (tests).
 */
export function enrichBlockWithAgentDog<T extends object>(
  blockOutput: T,
  context: BlockContext,
  settingsPath?: string,
): T | (T & { agentDog: AgentDogDiagnostic }) {
  const result = emitAgentDogDiagnostic(context, settingsPath);
  if (!result.emitted || result.diagnostic === null) {
    // Flag off — referentially equal to the input. Byte-identical.
    return blockOutput;
  }
  return { ...blockOutput, agentDog: result.diagnostic };
}

/**
 * Has the input BLOCK output been enriched with an AgentDoG diagnostic?
 * Useful for downstream consumers that want to opt into the enriched
 * shape without forcing a runtime cast.
 */
export function hasAgentDogDiagnostic<T extends object>(
  blockOutput: T,
): blockOutput is T & { agentDog: AgentDogDiagnostic } {
  return (
    blockOutput !== null &&
    typeof blockOutput === 'object' &&
    'agentDog' in blockOutput &&
    typeof (blockOutput as { agentDog?: unknown }).agentDog === 'object' &&
    (blockOutput as { agentDog?: unknown }).agentDog !== null
  );
}

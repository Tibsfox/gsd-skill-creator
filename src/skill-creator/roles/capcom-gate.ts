/**
 * HB-04 W/E/E roles — CAPCOM HARD GATE.
 *
 * The gate fires in two production scenarios:
 *
 *   1. **Role-split activation.** Transitioning from single-role
 *      (existing six-step loop, flag off) to W/E/E (flag on AND
 *      authorized). Without authorization, the role split refuses to
 *      engage even with the flag on; behavior degrades to single-role.
 *   2. **Protocol-update.** When the Evolution role proposes a change to
 *      a loop protocol (e.g., the auto-load policy). Without
 *      authorization, the proposal is staged but does not modify the
 *      active policy.
 *
 * Authorization is recorded as a file with a single line containing a
 * non-empty signature/identifier. The marker file lives at
 * `.planning/skill-creator/weler-roles.capcom`. Presence + non-empty
 * content is the gate-pass condition (mirrors HB-03's
 * `.planning/safety/std-calibration.capcom` pattern).
 *
 * Trigger-vs-auth separation: a separate `.planning/skill-creator/
 * weler-roles.trigger` marker records "user-requested role-split
 * activation" — the first half of the two-step protocol mirroring HB-03.
 * Presence of the trigger does NOT authorize; the CAPCOM marker does.
 *
 * Multi-operator extension follow-up: the local-marker shape is
 * v1.49.575-only; a future v1.49.576+ work item will add signed-
 * attestation verification. The {@link CapcomGateRecord.signedAttestation}
 * optional field is reserved now so that future drop-in is wire-
 * compatible.
 *
 * The flag-off invariant: when the weler-roles flag is off, the gate is
 * fully disabled — no record emitted, no authorization checked.
 *
 * @module skill-creator/roles/capcom-gate
 */

import fs from 'node:fs';
import path from 'node:path';

import { isWelerRolesEnabled } from './settings.js';
import type {
  CapcomGateReason,
  CapcomGateRecord,
  CapcomGateResult,
  PolicyUpdateProposal,
} from './types.js';

function projectRoot(): string {
  const envRoot = process.env.GSD_SKILL_CREATOR_CONFIG_ROOT;
  if (envRoot && envRoot.length > 0) return envRoot;
  return process.cwd();
}

/** Default path for the CAPCOM authorization marker file. */
export function defaultCapcomMarkerPath(): string {
  return path.join(
    projectRoot(),
    '.planning',
    'skill-creator',
    'weler-roles.capcom',
  );
}

/** Default path for the trigger (user-requested activation) marker file. */
export function defaultTriggerMarkerPath(): string {
  return path.join(
    projectRoot(),
    '.planning',
    'skill-creator',
    'weler-roles.trigger',
  );
}

const DISABLED_RESULT: CapcomGateResult = Object.freeze({
  emitted: false,
  authorized: false,
  disabled: true,
  record: null,
});

/**
 * Is the CAPCOM authorization marker present and non-empty?
 *
 * Returns false if the file is missing, empty, or unreadable.
 */
export function isCapcomAuthorized(markerPath?: string): boolean {
  const filePath = markerPath ?? defaultCapcomMarkerPath();
  if (!fs.existsSync(filePath)) return false;
  let contents = '';
  try {
    contents = fs.readFileSync(filePath, 'utf8');
  } catch {
    return false;
  }
  return contents.trim().length > 0;
}

/**
 * Is the user-requested-activation trigger marker present and non-empty?
 * Distinct from authorization (HB-03 trigger-vs-auth separation).
 */
export function isActivationTriggered(markerPath?: string): boolean {
  const filePath = markerPath ?? defaultTriggerMarkerPath();
  if (!fs.existsSync(filePath)) return false;
  let contents = '';
  try {
    contents = fs.readFileSync(filePath, 'utf8');
  } catch {
    return false;
  }
  // Trigger marker may be empty per HB-03 convention (presence = trigger).
  return contents !== null && contents !== undefined;
}

/**
 * Emit a CAPCOM gate record for a candidate role-split or protocol-update
 * action. The record is *always* emitted when the flag is on; it reports
 * `authorized: true` only when the marker is present.
 *
 * Calling code MUST refuse to engage the role split / activate the
 * proposal when `authorized === false`.
 */
export function emitCapcomGate(
  reason: CapcomGateReason,
  options: {
    proposal?: PolicyUpdateProposal | null;
    note?: string;
    markerPath?: string;
    settingsPath?: string;
    signedAttestation?: string;
  } = {},
): CapcomGateResult {
  if (!isWelerRolesEnabled(options.settingsPath)) {
    return DISABLED_RESULT;
  }
  const authorized = isCapcomAuthorized(options.markerPath);
  const baseRecord: Omit<CapcomGateRecord, 'signedAttestation'> = {
    kind: reason,
    proposal: options.proposal ?? null,
    note: options.note ?? '',
    timestamp: new Date().toISOString(),
    authorized,
  };
  const record: CapcomGateRecord =
    options.signedAttestation !== undefined
      ? Object.freeze({ ...baseRecord, signedAttestation: options.signedAttestation })
      : Object.freeze(baseRecord);
  return Object.freeze({
    emitted: true,
    authorized,
    disabled: false,
    record,
  });
}

/** Disabled-result sentinel for callers + tests. */
export const CAPCOM_GATE_DISABLED_RESULT = DISABLED_RESULT;

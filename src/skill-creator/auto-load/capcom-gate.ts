/**
 * HB-07 AEL bandit — bandit-engagement CAPCOM HARD GATE.
 *
 * Two production scenarios fire a CAPCOM gate around the bandit:
 *
 *   1. **Bandit-engagement.** Transitioning from the existing single-policy
 *      auto-load (flag off, OR flag on but no auth) to bandit-driven
 *      auto-load. Without authorization, the existing auto-load runs
 *      unchanged (single-policy default, no posterior, no reflection).
 *      This gate fires from {@link emitBanditEngagementGate} below.
 *
 *   2. **Reflection-induced policy update.** When slow-loop reflection
 *      produces a `proposedPolicyChange` that would alter retrieval policy.
 *      That gate is HB-04's existing `'protocol-update'` emission; the
 *      AelBandit extension produces a `PolicyUpdateProposal` and HB-04's
 *      {@link evolutionPropose} fires the gate before activation. We do
 *      NOT re-emit a separate bandit-side gate for case (2); double-gating
 *      would create a confusing two-marker dance. The double-gate semantic
 *      that DOES exist is independent: the role-split gate (HB-04, fires
 *      inside `evolutionPropose`) authorizes the EXTENSION INVOCATION
 *      itself; the protocol-update gate (also HB-04) authorizes each
 *      proposal returned. The bandit-engagement gate here is in addition,
 *      protecting the transition from single-policy to bandit-driven mode
 *      *before* the extension is even handed to HB-04.
 *
 * Marker file:
 *   `.planning/skill-creator/ael-bandit.capcom`
 * Trigger marker (HB-03 trigger-vs-auth pattern):
 *   `.planning/skill-creator/ael-bandit.trigger`
 *
 * Mirrors HB-03 (`src/safety/std-calibration/capcom-gate.ts`) and the
 * HB-04 sister gate (`src/skill-creator/roles/capcom-gate.ts`) on the
 * same v1.49.575 cs25-26-sweep half.
 *
 * @module skill-creator/auto-load/capcom-gate
 */

import fs from 'node:fs';
import path from 'node:path';

import { isAelBanditEnabled } from './settings.js';

/** Reasons that fire the AEL-bandit CAPCOM gate. */
export type AelBanditGateReason =
  | 'bandit-engagement'
  | 'reflection-policy-update';

/** A single AEL-bandit CAPCOM gate emission record. */
export interface AelBanditGateRecord {
  readonly kind: AelBanditGateReason;
  readonly note: string;
  readonly timestamp: string;
  readonly authorized: boolean;
  /** Reserved; v1.49.576+ multi-operator extension drop-in. */
  readonly signedAttestation?: string;
}

/** Result of a gate emission. */
export interface AelBanditGateResult {
  readonly emitted: boolean;
  readonly authorized: boolean;
  readonly disabled: boolean;
  readonly record: AelBanditGateRecord | null;
}

const DISABLED_RESULT: AelBanditGateResult = Object.freeze({
  emitted: false,
  authorized: false,
  disabled: true,
  record: null,
});

export const AEL_BANDIT_GATE_DISABLED_RESULT = DISABLED_RESULT;

function projectRoot(): string {
  const envRoot = process.env.GSD_SKILL_CREATOR_CONFIG_ROOT;
  if (envRoot && envRoot.length > 0) return envRoot;
  return process.cwd();
}

/** Default authorization-marker path. */
export function defaultBanditCapcomMarkerPath(): string {
  return path.join(
    projectRoot(),
    '.planning',
    'skill-creator',
    'ael-bandit.capcom',
  );
}

/** Default trigger-marker path. */
export function defaultBanditTriggerMarkerPath(): string {
  return path.join(
    projectRoot(),
    '.planning',
    'skill-creator',
    'ael-bandit.trigger',
  );
}

/** Is the AEL-bandit CAPCOM authorization marker present + non-empty? */
export function isBanditCapcomAuthorized(markerPath?: string): boolean {
  const filePath = markerPath ?? defaultBanditCapcomMarkerPath();
  if (!fs.existsSync(filePath)) return false;
  let contents = '';
  try {
    contents = fs.readFileSync(filePath, 'utf8');
  } catch {
    return false;
  }
  return contents.trim().length > 0;
}

/** Is the user-requested-activation trigger marker present? */
export function isBanditActivationTriggered(markerPath?: string): boolean {
  const filePath = markerPath ?? defaultBanditTriggerMarkerPath();
  return fs.existsSync(filePath);
}

/**
 * Emit a bandit-engagement gate record. Always emits when the flag is on;
 * `authorized=true` only when the marker is present + non-empty.
 *
 * Calling code (the AelBandit extension) MUST refuse to engage —
 * i.e., return null from `proposePolicyUpdate` without touching its
 * posterior — when `authorized === false`.
 */
export function emitBanditEngagementGate(
  options: {
    note?: string;
    markerPath?: string;
    settingsPath?: string;
    signedAttestation?: string;
  } = {},
): AelBanditGateResult {
  if (!isAelBanditEnabled(options.settingsPath)) {
    return DISABLED_RESULT;
  }
  const authorized = isBanditCapcomAuthorized(options.markerPath);
  const baseRecord: Omit<AelBanditGateRecord, 'signedAttestation'> = {
    kind: 'bandit-engagement',
    note: options.note ?? '',
    timestamp: new Date().toISOString(),
    authorized,
  };
  const record: AelBanditGateRecord =
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

/**
 * Emit a reflection-induced-policy-update gate record. The HB-04
 * `protocol-update` gate ALSO fires for each returned proposal; this
 * record exists so the bandit can log the reflection-origin event with
 * its own trace, distinct from the HB-04-side proposal gate. Calling
 * code MAY rely on this record being staged even when `authorized=false`.
 */
export function emitReflectionPolicyUpdateGate(
  options: {
    note?: string;
    markerPath?: string;
    settingsPath?: string;
    signedAttestation?: string;
  } = {},
): AelBanditGateResult {
  if (!isAelBanditEnabled(options.settingsPath)) {
    return DISABLED_RESULT;
  }
  const authorized = isBanditCapcomAuthorized(options.markerPath);
  const baseRecord: Omit<AelBanditGateRecord, 'signedAttestation'> = {
    kind: 'reflection-policy-update',
    note: options.note ?? '',
    timestamp: new Date().toISOString(),
    authorized,
  };
  const record: AelBanditGateRecord =
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
